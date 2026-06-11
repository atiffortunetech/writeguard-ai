import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SHOWCASE_SECTIONS } from "@/lib/marketing-content";

function EditorMock({ variant }: { variant: "grammar" | "tone" | "reactions" }) {
  return (
    <div className="marketing-editor-mock">
      <div className="marketing-editor-toolbar">
        <span className="marketing-editor-dot bg-red-400" />
        <span className="marketing-editor-dot bg-amber-400" />
        <span className="marketing-editor-dot bg-emerald-400" />
        <span className="ml-2 text-xs font-medium text-slate-500">WriteGuard Editor</span>
      </div>
      <div className="space-y-3 p-5 text-sm">
        {variant === "grammar" && (
          <>
            <p className="text-slate-700">
              Our product help sellers adapt faster than ever to marketplace changes.
            </p>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700">Suggestion applied</p>
              <p className="text-emerald-800">Our product <u>helps</u> sellers adapt faster…</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">Grammar 96</span>
              <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-700">Clarity 91</span>
            </div>
          </>
        )}
        {variant === "tone" && (
          <>
            <p className="text-slate-700">Hey team — quick update on the launch timeline.</p>
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
              <p className="text-xs font-semibold text-violet-700">Tone: Friendly → Professional</p>
              <p className="text-violet-900">Dear team, please find below an update on our launch schedule.</p>
            </div>
            <span className="inline-block rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-xs font-medium text-fuchsia-700">Brand voice: On track</span>
          </>
        )}
        {variant === "reactions" && (
          <>
            <p className="text-slate-700">We guarantee results within 24 hours or your money back.</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Trust", score: 72 },
                { label: "Clarity", score: 88 },
                { label: "Urgency", score: 65 },
              ].map((r) => (
                <div key={r.label} className="rounded-lg border border-slate-200 p-2 text-center">
                  <p className="text-[10px] uppercase text-slate-500">{r.label}</p>
                  <p className="font-display text-lg font-bold text-violet-600">{r.score}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const MOCK_VARIANTS = ["grammar", "tone", "reactions"] as const;

export function ShowcaseSections() {
  return (
    <div className="space-y-24">
      {SHOWCASE_SECTIONS.map((section, i) => {
        const mock = MOCK_VARIANTS[i] ?? "grammar";
        const textFirst = section.imageSide === "right";

        return (
          <section key={section.id} id={section.id} className="marketing-section">
            <div className="marketing-container">
              <div className={`grid items-center gap-12 lg:grid-cols-2 ${textFirst ? "" : "lg:[&>*:first-child]:order-2"}`}>
                <div>
                  <p className="marketing-eyebrow mb-3">{section.eyebrow}</p>
                  <h2 className="font-display mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
                    {section.title}
                  </h2>
                  <p className="mb-6 text-lg leading-relaxed text-slate-600">{section.description}</p>
                  <ul className="mb-8 space-y-3">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-slate-700">
                        <Check className="h-5 w-5 shrink-0 text-violet-600" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-800"
                  >
                    Try WriteGuard free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className={`marketing-showcase-panel bg-gradient-to-br ${section.gradient}`}>
                  <EditorMock variant={mock} />
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
