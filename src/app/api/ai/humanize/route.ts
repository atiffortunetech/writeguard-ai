import { normalizeIntensity } from "@/prompts/humanizer";
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

  const provider = getAIProvider();
  const result = await provider.humanize(
    parsed.data.text,
    parsed.data.mode,
    brandVoice ?? undefined,
    {
      intensity: normalizeIntensity(parsed.data.intensity),
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
