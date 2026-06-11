import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MarketingHeader,
  MarketingFooter,
  MarketingCta,
} from "@/components/marketing/header-footer";
import { FEATURE_GROUPS } from "@/lib/marketing-content";
import { ArrowRight } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="marketing-page min-h-screen">
      <MarketingHeader />

      <main>
        <section className="marketing-hero marketing-container border-b border-violet-100">
          <p className="marketing-eyebrow mb-4">Product</p>
          <h1 className="marketing-headline mx-auto mb-6 max-w-3xl">
            Everything you need to write at your best
          </h1>
          <p className="marketing-subhead mb-8">
            WriteGuard AI combines grammar checking, AI rewriting, brand voice, team collaboration,
            and 30+ specialized tools — the full stack inspired by{" "}
            <a
              href="https://www.grammarly.com/"
              className="text-violet-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Grammarly
            </a>
            , built for WriteGuard.
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
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-lg">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                        {group.title}
                      </h2>
                      <p className="mt-1 text-slate-600">{group.description}</p>
                    </div>
                  </div>
                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800"
                  >
                    Browse tools <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {group.features.map((f) => (
                    <div
                      key={f.title}
                      className="rounded-2xl border border-violet-100 bg-white p-6 transition-shadow hover:shadow-md"
                    >
                      <h3 className="font-display mb-2 font-bold text-slate-900">{f.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        <MarketingCta
          title="Ready to write with confidence?"
          description="Join WriteGuard AI and unlock grammar, humanizer, plagiarism detection, and every tool in one workspace."
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
