import { requireApiAuth } from "@/lib/api-utils";
import { findActiveSubscription } from "@/lib/db";
import { getUserPlanTier, getUserUsageThisMonth } from "@/lib/usage";
import { PLAN_DEFINITIONS } from "@/lib/stripe";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const [subscription, tier, usage] = await Promise.all([
    findActiveSubscription(auth.session.user.id),
    getUserPlanTier(auth.session.user.id),
    getUserUsageThisMonth(auth.session.user.id),
  ]);

  const plan = PLAN_DEFINITIONS[tier];

  return Response.json({
    tier,
    plan,
    subscription,
    usage,
    creditsRemaining:
      plan.aiCreditsMonthly === -1
        ? null
        : Math.max(0, plan.aiCreditsMonthly - usage.aiRequests),
  });
}
