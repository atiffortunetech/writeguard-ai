"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, ExternalLink, Check } from "lucide-react";
import type { PlanTier } from "@/types/database";

interface BillingData {
  tier: string;
  plan: { name: string; priceMonthly: number; aiCreditsMonthly: number };
  usage: { aiRequests: number; documents: number };
  creditsRemaining: number | null;
  creditsLimit: number | null;
  subscription: { status: string; cancelAtPeriodEnd: boolean } | null;
  access?: {
    source: string;
    creditLimitLabel: string;
    toolsModeLabel: string;
  };
}

interface PlanFeaturesData {
  tier: PlanTier;
  isAdmin: boolean;
  planFeatures: string[];
  allTiers: Record<PlanTier, string[]>;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanFeaturesData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing").then((r) => r.json()).then(setData);
    fetch("/api/plan/features").then((r) => r.json()).then(setPlanInfo);
  }, []);

  const startCheckout = async (tier: string) => {
    setLoading(tier); setError(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, interval: "monthly" }),
    });
    const result = await res.json();
    setLoading(null);
    if (!res.ok) { setError(result.error); return; }
    if (result.url) window.location.href = result.url;
  };

  const openPortal = async () => {
    setLoading("portal"); setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const result = await res.json();
    setLoading(null);
    if (!res.ok) { setError(result.error); return; }
    if (result.url) window.location.href = result.url;
  };

  const creditCap = data?.creditsLimit ?? null;
  const creditPercent =
    creditCap && creditCap > 0
      ? Math.min(100, (data!.usage.aiRequests / creditCap) * 100)
      : 0;
  const planLabel =
    data?.access?.source === "override"
      ? `Custom Access (${data.access.creditLimitLabel} credits)`
      : data?.plan.name;
  const tierBadge =
    data?.access?.source === "override" ? "GRANTED" : data?.tier;

  return (
    <>
      <DashboardHeader title="Billing" description="Manage your subscription and usage" />
      <div className="flex-1 overflow-y-auto p-8">
        {error && <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-2xl font-bold">{data.plan.name}</span>
                    <Badge>{data.tier}</Badge>
                  </div>
                  {data.subscription?.cancelAtPeriodEnd && (
                    <p className="mb-4 text-sm text-amber-600">Cancels at end of billing period</p>
                  )}
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>AI credits used</span>
                      <span>
                        {data.usage.aiRequests} /{" "}
                        {creditCap === null ? "∞" : creditCap}
                      </span>
                    </div>
                    {creditCap !== null && creditCap > 0 && (
                      <Progress value={creditPercent} />
                    )}
                  </div>
                  <Button variant="outline" onClick={openPortal} disabled={loading === "portal"}>
                    <ExternalLink className="h-4 w-4" /> Manage billing
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-500">Loading...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upgrade</CardTitle>
              <CardDescription>Unlock more features and higher limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => startCheckout("PRO")} disabled={loading === "PRO" || data?.tier === "PRO"}>
                Upgrade to Pro — $19/mo
              </Button>
              <Button className="w-full" variant="outline" onClick={() => startCheckout("BUSINESS")} disabled={loading === "BUSINESS" || data?.tier === "BUSINESS"}>
                Upgrade to Business — $49/mo
              </Button>
            </CardContent>
          </Card>
        </div>

        {planInfo && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your plan includes</CardTitle>
              <CardDescription>
                {planInfo.isAdmin
                  ? "Admin account — all features unlocked"
                  : `Features included on your ${data?.plan.name ?? planInfo.tier} plan`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {planInfo.planFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              {data?.tier === "FREE" && planInfo.allTiers.PRO && (
                <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                  <p className="mb-2 text-sm font-medium text-slate-800">Upgrade to Pro to unlock:</p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {planInfo.allTiers.PRO.filter(
                      (f) => !planInfo.allTiers.FREE.includes(f)
                    ).slice(0, 6).map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
