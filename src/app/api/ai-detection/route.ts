import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiDetectionSchema } from "@/lib/validations";
import { getAIDetectionProvider, AI_DETECTION_DISCLAIMER } from "@/providers/ai-detection";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logUsage, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { logActivity } from "@/lib/activity";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const start = Date.now();
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const rate = await checkRateLimit(auth.session.user.id, aiRateLimiter);
  if (!rate.success) return apiError("Rate limit exceeded", 429);

  const usage = await checkUsageLimit(auth.session.user.id, "ai_request");
  if (!usage.allowed) return apiError(usage.reason ?? "Limit reached", 403);

  const access = await checkFeatureAccess(auth.session.user.id, "ai-detector");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const body = await req.json();
  const parsed = aiDetectionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const provider = getAIDetectionProvider();

  if (!provider.isConfigured()) {
    return Response.json({
      configured: false,
      message: "AI detection provider not configured.",
      disclaimer: AI_DETECTION_DISCLAIMER,
      provider: provider.name,
    });
  }

  try {
    const result = await provider.detectAI(parsed.data.text);

    const check = await prisma.aIDetectionCheck.create({
      data: {
        userId: auth.session.user.id,
        content: parsed.data.text.slice(0, 10000),
        aiProbability: result.aiProbability,
        humanProbability: result.humanProbability,
        mixedEstimate: result.mixedEstimate,
        highlights: result.highlights,
        provider: result.provider,
        status: "completed",
      },
    });

    await logUsage(auth.session.user.id, "ai_detection_check");
    await logAIRequest({
      userId: auth.session.user.id,
      endpoint: "/api/ai-detection",
      model: process.env.OPENAI_DETECTION_MODEL || process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - start,
    });
    await logActivity({
      userId: auth.session.user.id,
      type: "AI_DETECTION_CHECK",
      description: "AI detection check completed",
    });

    return Response.json({
      configured: true,
      checkId: check.id,
      ...result,
      disclaimer: AI_DETECTION_DISCLAIMER,
    });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : "AI detection failed",
      503
    );
  }
}

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const checks = await prisma.aIDetectionCheck.findMany({
    where: { userId: auth.session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      aiProbability: true,
      humanProbability: true,
      provider: true,
      status: true,
      createdAt: true,
    },
  });

  const provider = getAIDetectionProvider();
  return Response.json({
    checks,
    providerConfigured: provider.isConfigured(),
    disclaimer: AI_DETECTION_DISCLAIMER,
  });
}
