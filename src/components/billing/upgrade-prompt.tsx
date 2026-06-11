"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles } from "lucide-react";
import type { PlanTier } from "@/generated/prisma/client";
import { PLAN_DEFINITIONS } from "@/lib/stripe";

export function UpgradePrompt({
  featureName,
  requiredTier,
  currentTier,
}: {
  featureName: string;
  requiredTier: PlanTier;
  currentTier: PlanTier;
}) {
  const plan = PLAN_DEFINITIONS[requiredTier];

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
        <Lock className="h-7 w-7 text-violet-600" />
      </div>
      <Badge className="mb-3">{plan.name} plan</Badge>
      <h3 className="font-display mb-2 text-xl font-bold text-slate-900">
        {featureName} is locked
      </h3>
      <p className="mb-6 max-w-sm text-sm text-slate-600">
        Your current plan is <strong>{PLAN_DEFINITIONS[currentTier].name}</strong>.
        Upgrade to <strong>{plan.name}</strong> (${plan.priceMonthly}/mo) to unlock{" "}
        {featureName} and more.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard/billing">
            <Sparkles className="h-4 w-4" />
            Upgrade to {plan.name}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/pricing">Compare plans</Link>
        </Button>
      </div>
    </div>
  );
}
