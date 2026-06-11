import { auth } from "@/lib/auth";
import { getUserPlanTier, isAppAdmin } from "@/lib/usage";
import {
  FEATURE_MIN_TIER,
  getUnlockedFeatures,
  isFeatureUnlockedForTier,
  PLAN_FEATURE_SUMMARY,
} from "@/lib/plan-features";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import type { PlanTier } from "@/types/database";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = await getUserPlanTier(session.user.id);
  const isAdmin = await isAppAdmin(session.user.id);

  const features: Record<string, boolean> = {};
  for (const featureId of Object.keys(FEATURE_MIN_TIER)) {
    features[featureId] = isAdmin || isFeatureUnlockedForTier(featureId, tier);
  }

  return Response.json({
    tier,
    isAdmin,
    planName: PLAN_DEFINITIONS[tier].name,
    features,
    unlocked: getUnlockedFeatures(tier),
    planFeatures: PLAN_FEATURE_SUMMARY[tier as PlanTier],
    allTiers: PLAN_FEATURE_SUMMARY,
  });
}
