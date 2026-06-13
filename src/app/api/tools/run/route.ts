import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { isAIConfigured } from "@/providers/ai";
import { runWritingTool } from "@/lib/run-writing-tool";
import { getToolBySlug } from "@/lib/tools-registry";

const schema = z.object({
  tool: z.string().min(1),
  text: z.string().min(1).max(50000),
  html: z.string().max(200000).optional(),
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

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const tool = getToolBySlug(parsed.data.tool);
  if (!tool || tool.type !== "ai") {
    return apiError("Invalid or unsupported tool", 400);
  }

  const access = await checkFeatureAccess(auth.session.user.id, parsed.data.tool);
  if (!access.allowed) {
    return apiError(access.reason ?? "Upgrade required", 403);
  }

  try {
    const result = await runWritingTool(parsed.data.tool, parsed.data.text, {
      html: parsed.data.html,
    });

    await logAIRequest({
      userId: auth.session.user.id,
      endpoint: `/api/tools/run?tool=${parsed.data.tool}`,
      model: process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - start,
    });

    return Response.json(result);
  } catch (err) {
    console.error("Tool run error:", err);
    return apiError(err instanceof Error ? err.message : "Tool failed", 500);
  }
}
