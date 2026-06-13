import type { PlanTier, ToolsAccessMode, UserAccess } from "@/types/database";
import { findActiveSubscription, findUserAccess, findUserById } from "@/lib/db";
import { PLAN_DEFINITIONS } from "@/lib/stripe";

export type EffectiveAccess = {
  source: "admin" | "override" | "default_locked" | "expired";
  creditLimit: number | null;
  /** Resolved monthly AI credit cap: -1 unlimited, 0 none, N number */
  monthlyCredits: number;
  toolsMode: ToolsAccessMode;
  featureTier: PlanTier;
  access: UserAccess | null;
  isExpired: boolean;
};

async function getSubscriptionTier(userId: string): Promise<PlanTier> {
  const subscription = await findActiveSubscription(userId);
  return subscription?.plan.tier ?? "FREE";
}

function isExpired(access: UserAccess): boolean {
  if (!access.expiresAt) return false;
  return access.expiresAt.getTime() < Date.now();
}

function resolveFeatureTier(
  toolsMode: ToolsAccessMode,
  featureTier: PlanTier | null,
  subscriptionTier: PlanTier
): PlanTier {
  switch (toolsMode) {
    case "all":
      return "ENTERPRISE";
    case "plan":
      return subscriptionTier;
    case "tier":
      return featureTier ?? subscriptionTier;
    case "locked":
    default:
      return "FREE";
  }
}

function resolveMonthlyCredits(
  creditLimit: number | null,
  subscriptionTier: PlanTier
): number {
  if (creditLimit === null) {
    return PLAN_DEFINITIONS[subscriptionTier].aiCreditsMonthly;
  }
  return creditLimit;
}

export async function getEffectiveAccess(userId: string): Promise<EffectiveAccess> {
  const user = await findUserById(userId);
  if (user?.role === "ADMIN") {
    return {
      source: "admin",
      creditLimit: -1,
      monthlyCredits: -1,
      toolsMode: "all",
      featureTier: "ENTERPRISE",
      access: null,
      isExpired: false,
    };
  }

  const access = await findUserAccess(userId);
  const subscriptionTier = await getSubscriptionTier(userId);

  if (!access) {
    return {
      source: "default_locked",
      creditLimit: 0,
      monthlyCredits: 0,
      toolsMode: "locked",
      featureTier: "FREE",
      access: null,
      isExpired: false,
    };
  }

  if (isExpired(access)) {
    return {
      source: "expired",
      creditLimit: 0,
      monthlyCredits: 0,
      toolsMode: "locked",
      featureTier: "FREE",
      access,
      isExpired: true,
    };
  }

  const featureTier = resolveFeatureTier(
    access.toolsMode,
    access.featureTier,
    subscriptionTier
  );
  const monthlyCredits = resolveMonthlyCredits(access.creditLimit, subscriptionTier);

  return {
    source: "override",
    creditLimit: access.creditLimit,
    monthlyCredits,
    toolsMode: access.toolsMode,
    featureTier,
    access,
    isExpired: false,
  };
}

export function formatCreditLimitDisplay(limit: number | null): string {
  if (limit === null) return "Plan default";
  if (limit === -1) return "Unlimited";
  return String(limit);
}

export function formatToolsModeDisplay(mode: ToolsAccessMode): string {
  switch (mode) {
    case "locked":
      return "Locked";
    case "all":
      return "All tools";
    case "plan":
      return "Follow billing plan";
    case "tier":
      return "Custom tier";
    default:
      return mode;
  }
}
