import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { isAIConfigured } from "@/providers/ai";
import { runSmartRewrite } from "@/lib/run-smart-rewrite";
import { SMART_REWRITE_MODE_IDS } from "@/lib/smart-rewrite-modes";

const schema = z.object({
  text: z.string().min(1).max(50000),
  mode: z.enum(SMART_REWRITE_MODE_IDS as unknown as [string, ...string[]]),
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

  const access = await checkFeatureAccess(auth.session.user.id, "smart-rewrite");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    const result = await runSmartRewrite(parsed.data.text, parsed.data.mode);

    await logAIRequest({
      userId: auth.session.user.id,
      endpoint: "/api/tools/smart-rewrite",
      model: process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - start,
    });

    return Response.json(result);
  } catch (err) {
    console.error("Smart rewrite error:", err);
    return apiError(err instanceof Error ? err.message : "Rewrite failed", 500);
  }
}
