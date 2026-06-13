import type { PlanTier } from "@/types/database";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import { getUserPlanTier, isAppAdmin } from "@/lib/usage";
import { getEffectiveAccess } from "@/lib/access-control";
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

  const effective = await getEffectiveAccess(userId);

  if (effective.toolsMode === "locked") {
    const requiredTier = FEATURE_MIN_TIER[featureId] ?? "PRO";
    if (requiredTier === "FREE") {
      return { allowed: true, requiredTier, currentTier: "FREE" };
    }
    return {
      allowed: false,
      requiredTier,
      currentTier: "FREE",
      reason:
        "This feature is locked. Visit Billing to upgrade or contact your administrator.",
    };
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
