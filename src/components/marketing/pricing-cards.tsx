"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
          <button type="button" data-active={!yearly} onClick={() => setYearly(false)}>
            Monthly
          </button>
          <button type="button" data-active={yearly} onClick={() => setYearly(true)}>
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
            <div
              key={tier}
              className={`marketing-bento-card relative flex flex-col ${
                isPopular
                  ? "border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-transparent shadow-[0_0_48px_rgba(124,58,237,0.15)]"
                  : ""
              }`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600">
                  Most popular
                </Badge>
              )}
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  {tier === "FREE" ? "For individuals" : tier === "PRO" ? "For professionals" : "For teams"}
                </p>
                <h3 className="font-display mt-2 text-2xl font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-white/45">{plan.description}</p>
                <div className="pt-4">
                  <span className="font-display text-4xl font-bold text-white">${price}</span>
                  <span className="text-white/40"> USD / month</span>
                  {tier !== "FREE" && (
                    <p className="mt-1 text-xs text-white/35">{billedNote}</p>
                  )}
                </div>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/55">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              {tier === "FREE" ? (
                <Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10" asChild>
                  <Link href="/signup">Create account</Link>
                </Button>
              ) : (
                <Button className={`w-full ${isPopular ? "btn-glow border-0 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"}`} asChild>
                  <Link href={`/signup?plan=${tier.toLowerCase()}`}>Get {plan.name}</Link>
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="marketing-bento-card mt-10 p-8 text-center">
          <h3 className="font-display mb-2 text-xl font-bold text-white">Enterprise</h3>
          <p className="mb-4 text-white/50">
            Custom limits, priority support, and SSO for larger organizations.
          </p>
          <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" asChild>
            <Link href="mailto:sales@writeguard.ai">Contact sales</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
