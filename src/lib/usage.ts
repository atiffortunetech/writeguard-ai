import type { PlanTier } from "@/types/database";
import {
  countAIRequestLogs,
  countBrandImagesByUserId,
  countDocuments,
  createAIRequestLog,
  createUsageLog,
  findActiveSubscription,
  findUserById,
} from "@/lib/db";
import { PLAN_DEFINITIONS } from "@/lib/stripe";

/** App admins bypass all plan limits (unlimited AI, documents, team, etc.) */
export async function isAppAdmin(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  return user?.role === "ADMIN";
}

export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  if (await isAppAdmin(userId)) {
    return "ENTERPRISE";
  }

  const subscription = await findActiveSubscription(userId);

  return subscription?.plan.tier ?? "FREE";
}

export async function getUserUsageThisMonth(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [aiRequests, documents] = await Promise.all([
    countAIRequestLogs({ userId, since: startOfMonth }),
    countDocuments(userId),
  ]);

  return { aiRequests, documents };
}

export async function checkUsageLimit(
  userId: string,
  action: "ai_request" | "document"
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  if (await isAppAdmin(userId)) {
    return { allowed: true };
  }

  const tier = await getUserPlanTier(userId);
  const limits = PLAN_DEFINITIONS[tier];
  const usage = await getUserUsageThisMonth(userId);

  if (action === "ai_request") {
    if (limits.aiCreditsMonthly === -1) return { allowed: true };
    const remaining = limits.aiCreditsMonthly - usage.aiRequests;
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: "AI credit limit reached for your plan. Upgrade to continue.",
        remaining: 0,
      };
    }
    return { allowed: true, remaining };
  }

  if (action === "document") {
    if (limits.maxDocuments === -1) return { allowed: true };
    if (usage.documents >= limits.maxDocuments) {
      return {
        allowed: false,
        reason: `Document limit reached (${limits.maxDocuments}). Upgrade to create more.`,
        remaining: 0,
      };
    }
    return {
      allowed: true,
      remaining: limits.maxDocuments - usage.documents,
    };
  }

  return { allowed: true };
}

export async function logAIRequest(params: {
  userId: string;
  endpoint: string;
  model?: string;
  tokensUsed?: number;
  promptTokens?: number;
  success?: boolean;
  errorMessage?: string;
  durationMs?: number;
}) {
  await createAIRequestLog(params);
}

export async function logUsage(
  userId: string,
  action: string,
  quantity = 1,
  metadata?: Record<string, unknown> | null
) {
  await createUsageLog({ userId, action, quantity, metadata: metadata ?? null });
}

export const BRAND_IMAGE_CREDIT_COST = Number(
  process.env.BRAND_IMAGE_CREDIT_COST || 5
);

export const BRAND_IMAGE_MONTHLY_LIMIT: Record<PlanTier, number> = {
  FREE: 0,
  PRO: 20,
  BUSINESS: 100,
  ENTERPRISE: -1,
};

export async function checkBrandImageGenerationAllowed(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  creditCost: number;
  imagesRemaining?: number;
}> {
  const creditCost = BRAND_IMAGE_CREDIT_COST;

  if (await isAppAdmin(userId)) {
    return { allowed: true, creditCost };
  }

  const tier = await getUserPlanTier(userId);
  const imageLimit = BRAND_IMAGE_MONTHLY_LIMIT[tier];

  if (imageLimit === 0) {
    return {
      allowed: false,
      reason: "Brand Image Studio requires a Pro plan or higher.",
      creditCost,
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const imagesThisMonth = await countBrandImagesByUserId(userId, startOfMonth);

  if (imageLimit > 0 && imagesThisMonth >= imageLimit) {
    return {
      allowed: false,
      reason: `Monthly image limit reached (${imageLimit}). Upgrade or wait until next month.`,
      creditCost,
      imagesRemaining: 0,
    };
  }

  const limits = PLAN_DEFINITIONS[tier];
  const usage = await getUserUsageThisMonth(userId);

  if (limits.aiCreditsMonthly !== -1) {
    const remaining = limits.aiCreditsMonthly - usage.aiRequests;
    if (remaining < creditCost) {
      return {
        allowed: false,
        reason: `Not enough AI credits (need ${creditCost}, have ${Math.max(0, remaining)}).`,
        creditCost,
        imagesRemaining:
          imageLimit > 0 ? Math.max(0, imageLimit - imagesThisMonth) : undefined,
      };
    }
  }

  return {
    allowed: true,
    creditCost,
    imagesRemaining:
      imageLimit > 0 ? imageLimit - imagesThisMonth : undefined,
  };
}

export async function consumeBrandImageCredits(
  userId: string,
  creditCost: number,
  endpoint: string,
  model?: string,
  durationMs?: number
) {
  for (let i = 0; i < creditCost; i++) {
    await logAIRequest({
      userId,
      endpoint,
      model,
      success: true,
      durationMs: i === 0 ? durationMs : undefined,
    });
  }
  await logUsage(userId, "brand_image_generated", 1);
}
