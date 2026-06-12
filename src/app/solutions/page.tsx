import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingCta } from "@/components/marketing/header-footer";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { SOLUTIONS } from "@/lib/marketing-content";
import { Check, ArrowRight } from "lucide-react";

export default function SolutionsPage() {
  return (
    <MarketingShell>
      <section className="marketing-hero marketing-container border-b border-white/6">
        <p className="marketing-eyebrow mb-4">Solutions</p>
        <h1 className="marketing-headline mb-6 max-w-3xl">
          WriteGuard for every team and workflow
        </h1>
        <p className="marketing-subhead mb-8 max-w-2xl text-left">
          Whether you&apos;re a solo creator, enterprise team, educator, or e-commerce seller —
          WriteGuard adapts to how you write.
        </p>
        <Button className="btn-glow border-0 text-white" asChild>
          <Link href="/signup">Start free</Link>
        </Button>
      </section>

      <section className="marketing-section">
        <div className="marketing-container">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((solution) => {
              const Icon = solution.icon;
              return (
                <article key={solution.id} id={solution.id} className="marketing-bento-card">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="font-display mb-2 text-xl font-bold text-white">
                    {solution.title}
                  </h2>
                  <p className="mb-5 text-sm leading-relaxed text-white/50">
                    {solution.description}
                  </p>
                  <ul className="space-y-2">
                    {solution.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className="h-4 w-4 shrink-0 text-violet-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-container text-center">
          <h2 className="font-display mb-4 text-2xl font-bold text-white">
            Not sure which plan fits?
          </h2>
          <p className="mb-6 text-white/50">Compare features and pricing side by side.</p>
          <Link href="/pricing" className="marketing-link-inline">
            View pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarketingCta
        title="Your writing stack, unified"
        description="Stop switching between five different tools. WriteGuard gives you everything in one jet-black workspace."
      />
    </MarketingShell>
  );
}
