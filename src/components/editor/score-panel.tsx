"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/types/ai";

const SCORE_LABELS: Array<{ key: keyof AnalysisResult; label: string }> = [
  { key: "grammarScore", label: "Grammar" },
  { key: "clarityScore", label: "Clarity" },
  { key: "toneScore", label: "Tone" },
  { key: "readabilityScore", label: "Readability" },
  { key: "engagementScore", label: "Engagement" },
  { key: "brandScore", label: "Brand Voice" },
  { key: "seoScore", label: "SEO" },
  { key: "conversionScore", label: "Conversion" },
];

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export function ScorePanel({ analysis }: { analysis: AnalysisResult | null }) {
  if (!analysis) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-500">
          Run a grammar check to see your writing scores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Overall Score</h3>
          <span className={`text-2xl font-bold ${scoreColor(analysis.overallScore)}`}>
            {analysis.overallScore}
          </span>
        </div>
        <Progress value={analysis.overallScore} className="h-2" />
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Writing Scores</h3>
        {SCORE_LABELS.map(({ key, label }) => {
          const score = analysis[key] as number;
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className={`font-medium ${scoreColor(score)}`}>{score}</span>
              </div>
              <Progress value={score} className="h-1.5" />
            </div>
          );
        })}
      </div>

      {analysis.detectedTones && analysis.detectedTones.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-900">Detected Tone</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.detectedTones.map((tone) => (
              <Badge key={tone} variant="secondary">
                {tone}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-900">Recommendations</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-indigo-500">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
