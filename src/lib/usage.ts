import type { PlanTier } from "@/types/database";
import {
  countAIRequestLogs,
  countBrandImagesByUserId,
  countDocuments,
  createAIRequestLog,
  createUsageLog,
  findUserById,
} from "@/lib/db";
import { getEffectiveAccess } from "@/lib/access-control";
import { PLAN_DEFINITIONS } from "@/lib/stripe";

/** App admins bypass all plan limits (unlimited AI, documents, team, etc.) */
export async function isAppAdmin(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  return user?.role === "ADMIN";
}

export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  const effective = await getEffectiveAccess(userId);
  return effective.featureTier;
}

export async function getUserCreditPolicy(userId: string) {
  const effective = await getEffectiveAccess(userId);
  const usage = await getUserUsageThisMonth(userId);
  const limit = effective.monthlyCredits;
  const remaining =
    limit === -1 ? null : Math.max(0, limit - usage.aiRequests);

  return {
    ...effective,
    usageThisMonth: usage.aiRequests,
    creditsRemaining: remaining,
    documentsUsed: usage.documents,
  };
}

/** Credits shown in UI — respects admin overrides, not plan tier defaults. */
export function formatCreditsDisplay(
  monthlyCredits: number,
  creditsRemaining: number | null
): string | number {
  if (monthlyCredits === -1) return "Unlimited";
  return creditsRemaining ?? 0;
}

/** Plan label for dashboard/billing when access is admin-granted. */
export function getPlanDisplayName(
  source: Awaited<ReturnType<typeof getUserCreditPolicy>>["source"],
  featureTier: PlanTier,
  monthlyCredits: number
): string {
  if (source === "admin") return "Admin";
  if (source === "override") {
    return monthlyCredits === -1
      ? "Custom Access"
      : `Custom Access (${monthlyCredits} credits)`;
  }
  return PLAN_DEFINITIONS[featureTier].name;
}

export function getPlanDisplayBadge(
  source: Awaited<ReturnType<typeof getUserCreditPolicy>>["source"],
  featureTier: PlanTier
): string {
  if (source === "override") return "GRANTED";
  if (source === "admin") return "ADMIN";
  return featureTier;
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

  const effective = await getEffectiveAccess(userId);
  const tier = effective.featureTier;
  const limits = PLAN_DEFINITIONS[tier];
  const usage = await getUserUsageThisMonth(userId);

  if (action === "ai_request") {
    const cap = effective.monthlyCredits;
    if (cap === -1) return { allowed: true };
    if (cap <= 0) {
      return {
        allowed: false,
        reason:
          effective.toolsMode === "locked"
            ? "Your account is not activated yet. Visit Billing to upgrade or contact support."
            : "AI credit limit reached. Upgrade your plan to continue.",
        remaining: 0,
      };
    }
    const remaining = cap - usage.aiRequests;
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: "AI credit limit reached. Upgrade your plan to continue.",
        remaining: 0,
      };
    }
    return { allowed: true, remaining };
  }

  if (action === "document") {
    if (effective.toolsMode === "locked" && effective.monthlyCredits <= 0) {
      return {
        allowed: false,
        reason: "Your account is not activated yet. Visit Billing to upgrade or contact support.",
        remaining: 0,
      };
    }
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

  const effective = await getEffectiveAccess(userId);
  const tier = effective.featureTier;
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
  const cap = effective.monthlyCredits;

  if (cap !== -1) {
    const remaining = cap - usage.aiRequests;
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
