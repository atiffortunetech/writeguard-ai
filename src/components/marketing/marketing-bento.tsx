import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FULL_FEATURE_LIST, FEATURE_HIGHLIGHTS } from "@/lib/marketing-content";

export function MarketingBento() {
  return (
    <section className="marketing-section" id="features">
      <div className="marketing-container">
        <div className="mb-14 text-center">
          <p className="marketing-eyebrow mb-4">Complete platform</p>
          <h2 className="marketing-headline mx-auto mb-5 max-w-3xl">
            Every writing tool.{" "}
            <span className="gradient-text">One jet-powered workspace.</span>
          </h2>
          <p className="marketing-subhead mx-auto max-w-2xl">
            Grammar, AI intelligence, brand voice, team collaboration, commerce tools,
            SOP generation, and 30+ specialized agents — no tab switching, no empty dashboards.
          </p>
        </div>

        <div className="mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURE_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="marketing-bento-card marketing-bento-highlight">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-display mb-2 text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{item.description}</p>
                {item.stat && (
                  <p className="mt-4 font-display text-2xl font-bold gradient-text">{item.stat}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FULL_FEATURE_LIST.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.slug}
                id={feature.slug}
                className="marketing-bento-card group scroll-mt-28"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-300 transition-colors group-hover:border-violet-500/40 group-hover:bg-violet-500/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    {feature.tier}
                  </span>
                </div>
                <h3 className="font-display mb-1.5 font-bold text-white group-hover:text-violet-200">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/50">{feature.description}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/features" className="marketing-link-inline">
            Explore full feature breakdown
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
