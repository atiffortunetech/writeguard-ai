import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { amazonListingSchema } from "@/lib/validations";
import { getAIProvider, isAIConfigured } from "@/providers/ai";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const start = Date.now();
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const rate = await checkRateLimit(auth.session.user.id, aiRateLimiter);
  if (!rate.success) return apiError("Rate limit exceeded", 429);

  const usage = await checkUsageLimit(auth.session.user.id, "ai_request");
  if (!usage.allowed) return apiError(usage.reason ?? "Limit reached", 403);

  if (!isAIConfigured()) return apiError("AI provider not configured", 503);

  const access = await checkFeatureAccess(auth.session.user.id, "amazon");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const body = await req.json();
  const parsed = amazonListingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  let brandVoice;
  if (parsed.data.brandVoiceId) {
    brandVoice = await prisma.brandVoice.findFirst({
      where: { id: parsed.data.brandVoiceId, userId: auth.session.user.id },
    });
  }

  const provider = getAIProvider();
  const result = await provider.generateAmazonListing({
    ...parsed.data,
    brandVoice: brandVoice
      ? `${brandVoice.name}: ${brandVoice.tone ?? ""} ${brandVoice.writingStyle ?? ""}`
      : undefined,
  });

  await logAIRequest({
    userId: auth.session.user.id,
    endpoint: "/api/ai/amazon-listing",
    model: process.env.OPENAI_MODEL,
    success: true,
    durationMs: Date.now() - start,
  });

  await logActivity({
    userId: auth.session.user.id,
    type: "AI_REQUEST",
    description: `Generated Amazon listing for ${parsed.data.productName}`,
  });

  return Response.json(result);
}
