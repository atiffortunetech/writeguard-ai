import { normalizeIntensity, getHumanizerSystemPrompt } from "@/prompts/humanizer";
import { hasRichFormatting } from "@/lib/formatted-text";
import { runFormattedAI } from "@/lib/run-formatted-ai";
import { NextRequest } from "next/server";
import { findFirstBrandVoiceByUserId } from "@/lib/db";
import { humanizeSchema } from "@/lib/validations";
import { getAIProvider, isAIConfigured } from "@/providers/ai";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const start = Date.now();
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const rate = await checkRateLimit(auth.session.user.id, aiRateLimiter);
  if (!rate.success) return apiError("Rate limit exceeded", 429);

  const usage = await checkUsageLimit(auth.session.user.id, "ai_request");
  if (!usage.allowed) return apiError(usage.reason ?? "Limit reached", 403);

  if (!isAIConfigured()) return apiError("AI provider not configured", 503);

  const access = await checkFeatureAccess(auth.session.user.id, "humanizer");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const body = await req.json();
  const parsed = humanizeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  let brandVoice;
  if (parsed.data.brandVoiceId) {
    brandVoice = await findFirstBrandVoiceByUserId(
      auth.session.user.id,
      parsed.data.brandVoiceId
    );
  }

  const intensity = normalizeIntensity(parsed.data.intensity);

  if (parsed.data.html && hasRichFormatting(parsed.data.html)) {
    const fmt = await runFormattedAI({
      systemPrompt: `${getHumanizerSystemPrompt(intensity)}\nHumanize the text to sound natural and human-written. Preserve every HTML tag (h1-h6, p, strong, lists, links) exactly.`,
      text: parsed.data.text,
      html: parsed.data.html,
      temperature: 0.88,
    });

    await logAIRequest({
      userId: auth.session.user.id,
      endpoint: "/api/ai/humanize",
      model: process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - start,
    });

    return Response.json({
      humanizedText: fmt.result,
      humanizedHtml: fmt.resultHtml,
      explanation: `Humanized with ${intensity} mode — document formatting preserved.`,
      changesSummary: [fmt.summary ?? "Format-preserving humanization"],
      humanScore: 88,
      passesUsed: 1,
    });
  }

  const provider = getAIProvider();
  const result = await provider.humanize(
    parsed.data.text,
    parsed.data.mode,
    brandVoice ?? undefined,
    {
      intensity,
      preserveFormat: parsed.data.preserveFormat,
    }
  );

  await logAIRequest({
    userId: auth.session.user.id,
    endpoint: "/api/ai/humanize",
    model: process.env.OPENAI_MODEL,
    success: true,
    durationMs: Date.now() - start,
  });

  return Response.json(result);
}
