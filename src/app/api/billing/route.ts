import { requireApiAuth } from "@/lib/api-utils";
import { findActiveSubscription } from "@/lib/db";
import { getUserCreditPolicy, getUserUsageThisMonth } from "@/lib/usage";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import {
  formatCreditLimitDisplay,
  formatToolsModeDisplay,
} from "@/lib/access-control";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const [subscription, policy, usage] = await Promise.all([
    findActiveSubscription(auth.session.user.id),
    getUserCreditPolicy(auth.session.user.id),
    getUserUsageThisMonth(auth.session.user.id),
  ]);

  const plan = PLAN_DEFINITIONS[policy.featureTier];
  const cap = policy.monthlyCredits;

  return Response.json({
    tier: policy.featureTier,
    plan,
    subscription,
    usage,
    access: {
      source: policy.source,
      toolsMode: policy.toolsMode,
      toolsModeLabel: formatToolsModeDisplay(policy.toolsMode),
      creditLimit: policy.creditLimit,
      creditLimitLabel: formatCreditLimitDisplay(policy.creditLimit),
      isLocked: policy.toolsMode === "locked" && cap <= 0,
    },
    creditsRemaining: policy.creditsRemaining,
    creditsUsed: usage.aiRequests,
    creditsLimit: cap === -1 ? null : cap,
  });
}
