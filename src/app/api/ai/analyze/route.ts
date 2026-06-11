import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeSchema } from "@/lib/validations";
import { getAIProvider, isAIConfigured } from "@/providers/ai";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { findFirstBrandVoiceByUserId, findFirstStyleGuideByUserId } from "@/lib/db";

/** Keep requests fast enough for local dev and avoid huge OpenAI payloads */
const MAX_ANALYZE_CHARS = 12_000;

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(
      session.user.id,
      aiRateLimiter
    );
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }

    const usageCheck = await checkUsageLimit(session.user.id, "ai_request");
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason }, { status: 403 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: "AI provider not configured. Set OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { text, brandVoiceId, styleGuideId } = parsed.data;
    const truncated = text.length > MAX_ANALYZE_CHARS;
    const analyzeText = truncated ? text.slice(0, MAX_ANALYZE_CHARS) : text;

    let brandVoice;
    let styleGuide;

    if (brandVoiceId) {
      brandVoice = await findFirstBrandVoiceByUserId(session.user.id, brandVoiceId);
    }

    if (styleGuideId) {
      styleGuide = await findFirstStyleGuideByUserId(session.user.id, styleGuideId);
    }

    const provider = getAIProvider();
    const result = await provider.analyzeGrammar(analyzeText, {
      brandVoice: brandVoice ?? undefined,
      styleGuide: styleGuide ?? undefined,
    });

    await logAIRequest({
      userId: session.user.id,
      endpoint: "/api/ai/analyze",
      model: process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ ...result, truncated });
  } catch (error) {
    console.error("Analyze error:", error);

    const message =
      error instanceof Error && error.message.includes("API key")
        ? "OpenAI API key is invalid or missing. Check OPENAI_API_KEY in .env"
        : error instanceof Error && /timeout|timed out/i.test(error.message)
          ? "Analysis timed out. Try with a shorter document."
          : "Failed to analyze text. Check that the dev server is running.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
