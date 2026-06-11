"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { PLAN_DEFINITIONS } from "@/lib/stripe";

const DISPLAY_PLANS = ["FREE", "PRO", "BUSINESS"] as const;

export function PricingCards({ compact = false }: { compact?: boolean }) {
  const [yearly, setYearly] = useState(true);

  return (
    <div>
      <div className="mb-10 flex justify-center">
        <div className="marketing-pricing-toggle">
          <button
            type="button"
            data-active={!yearly}
            onClick={() => setYearly(false)}
          >
            Monthly
          </button>
          <button
            type="button"
            data-active={yearly}
            onClick={() => setYearly(true)}
          >
            Yearly <span className="ml-1 text-xs opacity-80">Save 20%</span>
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${compact ? "md:grid-cols-3" : "lg:grid-cols-3"}`}>
        {DISPLAY_PLANS.map((tier) => {
          const plan = PLAN_DEFINITIONS[tier];
          const isPopular = tier === "PRO";
          const price = yearly ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
          const billedNote = yearly
            ? `$${plan.priceYearly}/year billed annually`
            : `$${plan.priceMonthly}/month`;

          return (
            <Card
              key={tier}
              className={`relative flex flex-col border-violet-100 ${
                isPopular ? "border-violet-400 shadow-xl ring-2 ring-violet-200" : ""
              }`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600">
                  Most popular
                </Badge>
              )}
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  {tier === "FREE" ? "For individuals" : tier === "PRO" ? "For professionals" : "For teams"}
                </p>
                <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="font-display text-4xl font-bold text-slate-900">${price}</span>
                  <span className="text-slate-500"> USD / month</span>
                  {tier !== "FREE" && (
                    <p className="mt-1 text-xs text-slate-500">{billedNote}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {tier === "FREE" ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/signup">Create account</Link>
                  </Button>
                ) : (
                  <Button className={`w-full ${isPopular ? "btn-glow border-0 text-white" : ""}`} asChild>
                    <Link href={`/signup?plan=${tier.toLowerCase()}`}>Get {plan.name}</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-10 rounded-2xl border border-violet-100 bg-violet-50/50 p-8 text-center">
          <h3 className="font-display mb-2 text-xl font-bold text-slate-900">Enterprise</h3>
          <p className="mb-4 text-slate-600">
            Custom limits, priority support, and SSO for larger organizations.
          </p>
          <Button variant="outline" asChild>
            <Link href="mailto:sales@writeguard.ai">Contact sales</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
