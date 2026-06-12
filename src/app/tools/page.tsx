import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingCta } from "@/components/marketing/header-footer";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { TOOL_CATEGORIES, getToolsByCategory } from "@/lib/tools-registry";
import { FEATURE_MIN_TIER } from "@/lib/plan-tiers";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import { ArrowRight } from "lucide-react";

export default function ToolsMarketingPage() {
  return (
    <MarketingShell>
      <section className="marketing-hero marketing-container border-b border-white/6">
        <p className="marketing-eyebrow mb-4">Resources</p>
        <h1 className="marketing-headline mb-6 max-w-3xl">
          AI writing tools for every job
        </h1>
        <p className="marketing-subhead mb-8 max-w-2xl text-left">
          Grammar checkers, humanizers, SOP generators, counters, agents, and more —
          unified under WriteGuard AI.
        </p>
        <Button className="btn-glow border-0 text-white" asChild>
          <Link href="/signup">Try all tools free</Link>
        </Button>
      </section>

      {TOOL_CATEGORIES.filter((c) => c !== "Core").map((category) => {
        const tools = getToolsByCategory(category);
        if (tools.length === 0) return null;

        return (
          <section key={category} className="marketing-section scroll-mt-24">
            <div className="marketing-container">
              <h2 className="font-display mb-8 text-2xl font-bold text-white">{category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const tier = FEATURE_MIN_TIER[tool.slug] ?? "PRO";
                  const planName = PLAN_DEFINITIONS[tier].name;

                  return (
                    <article key={tool.slug} id={tool.slug} className="marketing-bento-card group scroll-mt-28">
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge
                          variant={tier === "FREE" ? "secondary" : "default"}
                          className="text-[10px] bg-violet-600/30 text-violet-200 border-violet-500/30"
                        >
                          {planName}
                        </Badge>
                      </div>
                      <h3 className="font-display mb-2 font-bold text-white group-hover:text-violet-200">
                        {tool.title}
                      </h3>
                      <p className="mb-4 text-sm leading-relaxed text-white/50">{tool.description}</p>
                      <Link href="/signup" className="marketing-link-inline">
                        Open in workspace
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      <MarketingCta
        title="All 30+ tools. One workspace."
        description="Sign up free and unlock grammar, humanizer, plagiarism, SOP generator, and every WriteGuard tool from your dashboard."
      />
    </MarketingShell>
  );
}
