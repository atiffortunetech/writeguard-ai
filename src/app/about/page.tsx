import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingCta } from "@/components/marketing/header-footer";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ABOUT_CONTENT, TRUST_STATS } from "@/lib/marketing-content";

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="marketing-hero marketing-container border-b border-white/6">
        <p className="marketing-eyebrow mb-4">About</p>
        <h1 className="marketing-headline mb-6 max-w-3xl">
          Built for writers who refuse to blend in
        </h1>
        <p className="marketing-subhead max-w-2xl text-left">{ABOUT_CONTENT.mission}</p>
      </section>

      <section className="marketing-section">
        <div className="marketing-container">
          <h2 className="font-display mb-10 text-center text-3xl font-bold text-white">
            What we believe
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT_CONTENT.values.map((value) => (
              <div key={value.title} className="marketing-bento-card">
                <h3 className="font-display mb-2 font-bold text-white">{value.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-trust-strip">
        <div className="marketing-container text-center">
          <p className="mb-8 text-sm font-semibold uppercase tracking-wider text-white/40">
            {TRUST_STATS.headline}
          </p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {Array.from({ length: TRUST_STATS.items.length / 2 }).map((_, i) => (
              <div key={i}>
                <p className="font-display text-2xl font-bold gradient-text">
                  {TRUST_STATS.items[i * 2]}
                </p>
                <p className="mt-1 text-sm text-white/45">{TRUST_STATS.items[i * 2 + 1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-container">
          <div className="marketing-security-panel text-center">
            <h2 className="font-display mb-4 text-2xl font-bold text-white">
              Ready to join WriteGuard?
            </h2>
            <p className="mb-6 text-white/50">
              Start free today. No credit card required.
            </p>
            <Button className="btn-glow border-0 text-white" asChild>
              <Link href="/signup">Create your account</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingCta />
    </MarketingShell>
  );
}
