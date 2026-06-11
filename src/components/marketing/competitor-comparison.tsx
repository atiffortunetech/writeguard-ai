import { Check, X, Minus } from "lucide-react";
import { COMPETITOR_COMPARISON } from "@/lib/marketing-content";

function Cell({ value }: { value: boolean | "partial" }) {
  if (value === true) {
    return <Check className="mx-auto h-5 w-5 text-emerald-600" />;
  }
  if (value === "partial") {
    return <Minus className="mx-auto h-5 w-5 text-amber-500" />;
  }
  return <X className="mx-auto h-5 w-5 text-slate-300" />;
}

export function CompetitorComparison() {
  return (
    <section className="marketing-container py-20">
      <div className="mb-12 text-center">
        <p className="marketing-eyebrow mb-3">Why WriteGuard</p>
        <h2 className="marketing-headline mx-auto max-w-3xl text-3xl sm:text-4xl">
          More advanced than Grammarly, QuillBot & Jasper — in one workspace
        </h2>
        <p className="marketing-subhead mx-auto mt-4 max-w-2xl text-base">
          Competitors sell separate products. WriteGuard combines writing intelligence, 30+ tools,
          humanizer, detector, translator, and brand studio.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-violet-100 bg-white/80 shadow-lg shadow-violet-500/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-violet-100 bg-violet-50/50">
              <th className="px-5 py-4 font-semibold text-slate-700">Feature</th>
              <th className="px-5 py-4 text-center font-semibold text-violet-700">WriteGuard</th>
              <th className="px-5 py-4 text-center font-semibold text-slate-600">Grammarly</th>
              <th className="px-5 py-4 text-center font-semibold text-slate-600">QuillBot</th>
            </tr>
          </thead>
          <tbody>
            {COMPETITOR_COMPARISON.map((row) => (
              <tr key={row.feature} className="border-b border-violet-50 last:border-0">
                <td className="px-5 py-3.5 text-slate-700">{row.feature}</td>
                <td className="px-5 py-3.5">
                  <Cell value={row.writeguard} />
                </td>
                <td className="px-5 py-3.5">
                  <Cell value={row.grammarly} />
                </td>
                <td className="px-5 py-3.5">
                  <Cell value={row.quillbot} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
