"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TOOL_CATEGORIES,
  getToolsByCategory,
  getToolHref,
} from "@/lib/tools-registry";
import {
  FEATURE_MIN_TIER,
  isFeatureUnlockedForTier,
  featureIdForToolSlug,
} from "@/lib/plan-tiers";
import type { PlanTier } from "@/types/database";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import { Lock } from "lucide-react";

export function ToolsHubGrid() {
  const [tier, setTier] = useState<PlanTier>("FREE");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/plan/features")
      .then((r) => r.json())
      .then((d) => {
        setTier(d.tier ?? "FREE");
        setIsAdmin(d.isAdmin ?? false);
        setLoaded(true);
      });
  }, []);

  return (
    <>
      {loaded && (
        <div className="mb-8 rounded-2xl border border-violet-200/60 bg-violet-50/50 p-4 text-sm text-slate-700">
          Your plan: <strong>{PLAN_DEFINITIONS[tier].name}</strong>
          {isAdmin && (
            <Badge className="ml-2">Admin — all features unlocked</Badge>
          )}
          {tier === "FREE" && (
            <span className="ml-2">
              · <Link href="/dashboard/billing" className="text-violet-600 underline">Upgrade</Link> to unlock Pro & Business tools
            </span>
          )}
        </div>
      )}

      {TOOL_CATEGORIES.filter((c) => c !== "Core").map((category) => {
        const tools = getToolsByCategory(category);
        if (tools.length === 0) return null;

        return (
          <section key={category} className="mb-10">
            <h2 className="font-display mb-4 text-lg font-bold text-slate-900">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const fid = featureIdForToolSlug(tool.slug);
                const required = FEATURE_MIN_TIER[fid] ?? "PRO";
                const unlocked =
                  isAdmin ||
                  tool.type === "counter" ||
                  isFeatureUnlockedForTier(fid, tier);
                const href = unlocked ? getToolHref(tool) : "/dashboard/billing";

                return (
                  <Link key={tool.slug} href={href}>
                    <Card
                      className={`glass-card relative h-full border-0 transition-all ${
                        unlocked
                          ? "hover:-translate-y-1 hover:shadow-lg"
                          : "opacity-75"
                      }`}
                    >
                      {!unlocked && (
                        <div className="absolute right-3 top-3">
                          <Badge variant="secondary" className="gap-1 text-[10px]">
                            <Lock className="h-3 w-3" />
                            {PLAN_DEFINITIONS[required].name}
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-md">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-base">{tool.title}</CardTitle>
                        <CardDescription className="line-clamp-2 text-xs">
                          {tool.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
