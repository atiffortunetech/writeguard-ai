import { MarketingCta } from "@/components/marketing/header-footer";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PricingCards } from "@/components/marketing/pricing-cards";

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="marketing-container py-20">
        <div className="mb-12 text-center">
          <p className="marketing-eyebrow mb-4">Pricing</p>
          <h1 className="marketing-headline mx-auto mb-6 max-w-2xl">
            Simple, transparent pricing
          </h1>
          <p className="marketing-subhead mx-auto">
            Choose the plan that fits your writing workflow. Upgrade anytime — no hidden fees.
          </p>
        </div>

        <PricingCards />

        <div className="marketing-bento-card mt-16 p-8">
          <h3 className="font-display mb-4 text-xl font-bold text-white">Frequently asked</h3>
          <dl className="grid gap-6 md:grid-cols-2">
            {[
              {
                q: "Can I start for free?",
                a: "Yes. The Free plan includes grammar & spell checking, tone detector, counters, 5 documents, and 50 AI credits per month.",
              },
              {
                q: "What's included in Pro?",
                a: "Humanizer, plagiarism & AI detector, paraphrase, AI chat, templates, Amazon optimizer, resume builder, SOP generator, and 2,000 AI credits.",
              },
              {
                q: "When do I need Business?",
                a: "For team workspaces, style guides, writing analytics, authorship tools, and 10,000 AI credits.",
              },
              {
                q: "Can admins get unlimited access?",
                a: "Yes. Admin accounts bypass plan limits for testing and internal use.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="mb-1 font-semibold text-white">{item.q}</dt>
                <dd className="text-sm text-white/50">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <MarketingCta className="mt-8" />
    </MarketingShell>
  );
}
