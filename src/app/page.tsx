import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MarketingHeader,
  MarketingFooter,
  MarketingCta,
} from "@/components/marketing/header-footer";
import { ShowcaseSections } from "@/components/marketing/showcase-sections";
import { CompetitorComparison } from "@/components/marketing/competitor-comparison";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { AnimateIn } from "@/components/ui/animate-in";
import {
  HERO_AGENTS,
  TRUST_STATS,
  SECURITY_SECTION,
  WORK_AUDIENCES,
} from "@/lib/marketing-content";
import { Shield, Check, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="marketing-page min-h-screen">
      <MarketingHeader />

      <main>
        {/* Hero — Grammarly-style centered headline */}
        <section className="marketing-hero marketing-container">
          <AnimateIn>
            <h1 className="marketing-headline mx-auto mb-6 max-w-4xl">
              Think big.{" "}
              <span className="gradient-text">WriteGuard</span> handles the details.
            </h1>
          </AnimateIn>
          <AnimateIn delay={100}>
            <p className="marketing-subhead mb-10">
              Work with an AI partner that turns your ideas into writing that&apos;s clear,
              credible, and impossible to ignore — grammar, tone, humanizer, and 30+ tools in one place.
            </p>
          </AnimateIn>
          <AnimateIn delay={200}>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="btn-glow h-12 border-0 px-8 text-base text-white" asChild>
                <Link href="/signup">Sign up — It&apos;s free</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="/signup">Sign up with Google</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              By signing up, you agree to our Terms and Privacy Policy.
            </p>
          </AnimateIn>

          {/* Agent cards row — like Grammarly hero pills */}
          <AnimateIn delay={350} className="mt-16">
            <div className="marketing-card-grid mx-auto max-w-5xl">
              {HERO_AGENTS.map((agent) => {
                const Icon = agent.icon;
                return (
                  <Link key={agent.title} href={agent.href} className="marketing-agent-card group">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display mb-1 font-bold text-slate-900 group-hover:text-violet-700">
                      {agent.title}
                    </h3>
                    <p className="text-sm text-slate-500">{agent.description}</p>
                  </Link>
                );
              })}
            </div>
          </AnimateIn>
        </section>

        {/* Trust strip */}
        <section className="marketing-trust-strip">
          <div className="marketing-container text-center">
            <p className="mb-8 text-sm font-semibold uppercase tracking-wider text-slate-500">
              {TRUST_STATS.headline}
            </p>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {Array.from({ length: TRUST_STATS.items.length / 2 }).map((_, i) => (
                <div key={i}>
                  <p className="font-display text-2xl font-bold gradient-text">
                    {TRUST_STATS.items[i * 2]}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{TRUST_STATS.items[i * 2 + 1]}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Showcase sections */}
        <ShowcaseSections />

        <CompetitorComparison />

        {/* Who it's for */}
        <section className="marketing-section bg-slate-50/80">
          <div className="marketing-container">
            <div className="mb-12 text-center">
              <h2 className="font-display mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
                Built for every kind of writer
              </h2>
              <p className="text-slate-600">From solo creators to enterprise teams.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WORK_AUDIENCES.map((aud) => {
                const Icon = aud.icon;
                return (
                  <div
                    key={aud.title}
                    className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display mb-2 font-bold text-slate-900">{aud.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{aud.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="marketing-section" id="security">
          <div className="marketing-container">
            <div className="grid items-center gap-12 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-cyan-50/50 p-10 lg:grid-cols-2 lg:p-14">
              <div>
                <p className="marketing-eyebrow mb-3">{SECURITY_SECTION.eyebrow}</p>
                <h2 className="font-display mb-4 text-3xl font-bold text-slate-900">
                  {SECURITY_SECTION.title}
                </h2>
                <p className="mb-6 text-lg text-slate-600">{SECURITY_SECTION.description}</p>
                <ul className="space-y-3">
                  {SECURITY_SECTION.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-slate-700">
                      <Check className="h-5 w-5 text-violet-600" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex h-48 w-48 items-center justify-center rounded-full bg-white shadow-xl">
                  <Shield className="h-24 w-24 text-violet-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing preview */}
        <section className="marketing-section bg-white">
          <div className="marketing-container">
            <div className="mb-12 text-center">
              <h2 className="font-display mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
                Choose the right WriteGuard plan
              </h2>
              <p className="text-slate-600">Start free. Upgrade when you need more power.</p>
            </div>
            <PricingCards compact />
            <div className="mt-8 text-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-800"
              >
                Compare all plans
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <MarketingCta />
      </main>

      <MarketingFooter />
    </div>
  );
}
