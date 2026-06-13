import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingCta } from "@/components/marketing/header-footer";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { HeroScene3D } from "@/components/marketing/hero-3d-scene";
import { ShowcaseSections } from "@/components/marketing/showcase-sections";
import { MarketingBento } from "@/components/marketing/marketing-bento";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { AnimateIn } from "@/components/ui/animate-in";
import {
  HERO_AGENTS,
  TRUST_STATS,
  SECURITY_SECTION,
  WORK_AUDIENCES,
  FULL_FEATURE_LIST,
} from "@/lib/marketing-content";
import { Shield, Check, ArrowRight } from "lucide-react";

export default function HomePage() {
  const marqueeItems = FULL_FEATURE_LIST.map((f) => f.title);

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="marketing-hero marketing-container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <AnimateIn>
              <p className="marketing-eyebrow mb-4">AI writing workspace</p>
              <h1 className="marketing-headline mb-6 max-w-xl">
                Write like a pro.{" "}
                <span className="gradient-text">Ship like a machine.</span>
              </h1>
            </AnimateIn>
            <AnimateIn delay={100}>
              <p className="marketing-subhead mb-8 max-w-lg text-left">
                Grammar, humanizer, plagiarism detection, SOP generator, brand voice,
                and 30+ tools — unified in one jet-black workspace built for serious writers.
              </p>
            </AnimateIn>
            <AnimateIn delay={200}>
              <div className="flex w-full flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="btn-glow marketing-cta-primary h-12 w-full border-0 px-8 text-base text-white sm:w-auto"
                  asChild
                >
                  <Link href="/signup">Sign up — It&apos;s free</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full border-white/20 bg-transparent px-8 text-base text-white hover:bg-white/10 sm:w-auto"
                  asChild
                >
                  <Link href="/features">Explore features</Link>
                </Button>
              </div>
            </AnimateIn>

            {/* Mobile: static stats — no 3D orbit (prevents overlap/blink) */}
            <div className="mt-8 grid grid-cols-2 gap-3 lg:hidden">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Grammar</p>
                <p className="font-display text-2xl font-bold text-white">98</p>
                <p className="text-xs text-white/50">Clarity score</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">AI Risk</p>
                <p className="font-display text-2xl font-bold text-emerald-400">Low</p>
                <p className="text-xs text-white/50">Human-like tone</p>
              </div>
            </div>
          </div>
          <AnimateIn delay={300} direction="left" className="hidden lg:block">
            <HeroScene3D />
          </AnimateIn>
        </div>

        {/* Agent cards */}
        <AnimateIn delay={400} className="mt-20">
          <div className="marketing-card-grid mx-auto max-w-6xl">
            {HERO_AGENTS.map((agent) => {
              const Icon = agent.icon;
              return (
                <Link key={agent.title} href={agent.href} className="marketing-agent-card group">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mb-1 font-bold group-hover:text-violet-300">
                    {agent.title}
                  </h3>
                  <p className="text-sm">{agent.description}</p>
                </Link>
              );
            })}
          </div>
        </AnimateIn>
      </section>

      {/* Feature marquee */}
      <section className="border-y border-white/6 py-6">
        <div className="marketing-marquee">
          <div className="marketing-marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={`${item}-${i}`} className="marketing-marquee-item">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Trust stats */}
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

      <ShowcaseSections />
      <MarketingBento />

      {/* Audiences */}
      <section className="marketing-section">
        <div className="marketing-container">
          <div className="mb-12 text-center">
            <h2 className="font-display mb-4 text-3xl font-bold text-white md:text-4xl">
              Built for every kind of writer
            </h2>
            <p className="text-white/50">From solo creators to enterprise teams.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORK_AUDIENCES.map((aud) => {
              const Icon = aud.icon;
              return (
                <div key={aud.title} className="marketing-audience-card">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mb-2 font-bold text-white">{aud.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{aud.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link href="/solutions" className="marketing-link-inline">
              See all solutions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="marketing-section" id="security">
        <div className="marketing-container">
          <div className="marketing-security-panel grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="marketing-eyebrow mb-3">{SECURITY_SECTION.eyebrow}</p>
              <h2 className="font-display mb-4 text-3xl font-bold text-white">
                {SECURITY_SECTION.title}
              </h2>
              <p className="mb-6 text-lg text-white/55">{SECURITY_SECTION.description}</p>
              <ul className="space-y-3">
                {SECURITY_SECTION.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-white/70">
                    <Check className="h-5 w-5 text-violet-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative flex h-48 w-48 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-3xl animate-pulse-glow" />
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-violet-500/30 bg-black/60 backdrop-blur-xl">
                  <Shield className="h-24 w-24 text-violet-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="marketing-section">
        <div className="marketing-container">
          <div className="mb-12 text-center">
            <h2 className="font-display mb-4 text-3xl font-bold text-white md:text-4xl">
              Choose the right WriteGuard plan
            </h2>
            <p className="text-white/50">Start free. Upgrade when you need more power.</p>
          </div>
          <PricingCards compact />
          <div className="mt-8 text-center">
            <Link href="/pricing" className="marketing-link-inline">
              Compare all plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingCta />
    </MarketingShell>
  );
}
