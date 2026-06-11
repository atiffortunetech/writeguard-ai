import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rewriteSchema } from "@/lib/validations";
import { getAIProvider, isAIConfigured } from "@/providers/ai";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { findFirstBrandVoiceByUserId } from "@/lib/db";
import type { RewriteAction } from "@/types/ai";

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

    const featureAccess = await checkFeatureAccess(session.user.id, "rewrite");
    if (!featureAccess.allowed) {
      return NextResponse.json({ error: featureAccess.reason }, { status: 403 });
    }

    const body = await req.json();
    const parsed = rewriteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { text, action, targetTone, brandVoiceId } = parsed.data;

    let brandVoice;
    if (brandVoiceId) {
      brandVoice = await findFirstBrandVoiceByUserId(session.user.id, brandVoiceId);
    }

    const provider = getAIProvider();
    const result = await provider.rewrite(
      text,
      action as RewriteAction,
      {
        targetTone: targetTone ?? undefined,
        brandVoice: brandVoice ?? undefined,
      }
    );

    await logAIRequest({
      userId: session.user.id,
      endpoint: "/api/ai/rewrite",
      model: process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Rewrite error:", error);
    return NextResponse.json(
      { error: "Failed to rewrite text" },
      { status: 500 }
    );
  }
}
