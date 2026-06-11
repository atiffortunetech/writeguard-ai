import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { isAIConfigured } from "@/providers/ai";
import { runWritingIntelligence } from "@/lib/run-writing-intelligence";

const schema = z.object({
  text: z.string().min(10).max(50000),
  audience: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const start = Date.now();
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const rate = await checkRateLimit(auth.session.user.id, aiRateLimiter);
  if (!rate.success) return apiError("Rate limit exceeded", 429);

  const usage = await checkUsageLimit(auth.session.user.id, "ai_request");
  if (!usage.allowed) return apiError(usage.reason ?? "Limit reached", 403);

  if (!isAIConfigured()) return apiError("AI provider not configured", 503);

  const access = await checkFeatureAccess(auth.session.user.id, "writing-studio");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    const result = await runWritingIntelligence(
      parsed.data.text,
      parsed.data.audience
    );

    await logAIRequest({
      userId: auth.session.user.id,
      endpoint: "/api/writing/intelligence",
      model: process.env.OPENAI_INTELLIGENCE_MODEL || process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - start,
    });

    return Response.json(result);
  } catch (err) {
    console.error("Writing intelligence error:", err);
    return apiError(
      err instanceof Error ? err.message : "Analysis failed",
      500
    );
  }
}
