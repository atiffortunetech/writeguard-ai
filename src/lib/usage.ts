import type { PlanTier } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { PLAN_DEFINITIONS } from "@/lib/stripe";

/** App admins bypass all plan limits (unlimited AI, documents, team, etc.) */
export async function isAppAdmin(userId: string): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  const { prisma } = await import("@/lib/prisma");

  if (await isAppAdmin(userId)) {
    return "ENTERPRISE";
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  return subscription?.plan.tier ?? "FREE";
}

export async function getUserUsageThisMonth(userId: string) {
  const { prisma } = await import("@/lib/prisma");
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [aiRequests, documents] = await Promise.all([
    prisma.aIRequestLog.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    }),
    prisma.document.count({ where: { userId } }),
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
  const { prisma } = await import("@/lib/prisma");
  await prisma.aIRequestLog.create({ data: params });
}

export async function logUsage(
  userId: string,
  action: string,
  quantity = 1,
  metadata?: Prisma.InputJsonValue
) {
  const { prisma } = await import("@/lib/prisma");
  await prisma.usageLog.create({
    data: { userId, action, quantity, metadata: metadata ?? undefined },
  });
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

  const { prisma } = await import("@/lib/prisma");

  if (!("brandImage" in prisma) || !prisma.brandImage) {
    return { allowed: true, creditCost, imagesRemaining: undefined };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const imagesThisMonth = await prisma.brandImage.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });

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
