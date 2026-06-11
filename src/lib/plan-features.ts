import type { PlanTier } from "@/generated/prisma/client";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import { getUserPlanTier, isAppAdmin } from "@/lib/usage";
import {
  FEATURE_MIN_TIER,
  tierAtLeast,
  getUnlockedFeatures,
  isFeatureUnlockedForTier,
} from "@/lib/plan-tiers";

export {
  TIER_RANK,
  tierAtLeast,
  FEATURE_MIN_TIER,
  featureIdForToolSlug,
  PLAN_FEATURE_SUMMARY,
  isFeatureUnlockedForTier,
  getUnlockedFeatures,
} from "@/lib/plan-tiers";

export async function checkFeatureAccess(
  userId: string,
  featureId: string
): Promise<{
  allowed: boolean;
  requiredTier: PlanTier;
  currentTier: PlanTier;
  reason?: string;
}> {
  const requiredTier = FEATURE_MIN_TIER[featureId] ?? "PRO";

  if (await isAppAdmin(userId)) {
    return { allowed: true, requiredTier, currentTier: "ENTERPRISE" };
  }

  const currentTier = await getUserPlanTier(userId);

  if (tierAtLeast(currentTier, requiredTier)) {
    return { allowed: true, requiredTier, currentTier };
  }

  return {
    allowed: false,
    requiredTier,
    currentTier,
    reason: `${PLAN_DEFINITIONS[requiredTier].name} plan required. Upgrade to unlock this feature.`,
  };
}
