import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingCta } from "@/components/marketing/header-footer";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingBento } from "@/components/marketing/marketing-bento";
import { FEATURE_GROUPS } from "@/lib/marketing-content";
import { ArrowRight } from "lucide-react";

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="marketing-hero marketing-container border-b border-white/6">
        <p className="marketing-eyebrow mb-4">Product</p>
        <h1 className="marketing-headline mb-6 max-w-3xl">
          Everything you need to write at your best
        </h1>
        <p className="marketing-subhead mb-8 max-w-2xl text-left">
          WriteGuard AI combines grammar checking, AI rewriting, brand voice, team collaboration,
          SOP generation, and 30+ specialized tools in one professional workspace.
        </p>
        <Button className="btn-glow border-0 text-white" asChild>
          <Link href="/signup">Get started free</Link>
        </Button>
      </section>

      {FEATURE_GROUPS.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.id} id={group.id} className="marketing-section scroll-mt-24">
            <div className="marketing-container">
              <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/20">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
                      {group.title}
                    </h2>
                    <p className="mt-1 text-white/50">{group.description}</p>
                  </div>
                </div>
                <Link href="/tools" className="marketing-link-inline">
                  Browse tools <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {group.features.map((f) => (
                  <div key={f.title} className="marketing-bento-card">
                    <h3 className="font-display mb-2 font-bold text-white">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-white/50">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <MarketingBento />

      <MarketingCta
        title="Ready to write with confidence?"
        description="Join WriteGuard AI and unlock grammar, humanizer, plagiarism detection, SOP generator, and every tool in one workspace."
      />
    </MarketingShell>
  );
}
