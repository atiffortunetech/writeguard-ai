"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { WritingIntelligenceResult } from "@/lib/run-writing-intelligence";

function ScoreRing({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white/80 p-4 text-center">
      <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
      <Progress value={value} className="mt-2 h-1.5" />
    </div>
  );
}

export function WritingIntelligencePanel({
  data,
}: {
  data: WritingIntelligenceResult;
}) {
  const { metrics } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScoreRing label="Overall" value={data.overallScore} color="text-violet-600" />
        <ScoreRing label="Grammar" value={data.grammarScore} color="text-emerald-600" />
        <ScoreRing label="Clarity" value={data.clarityScore} color="text-cyan-600" />
        <ScoreRing label="Engagement" value={data.engagementScore} color="text-fuchsia-600" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Tone: {data.tone}</Badge>
        <Badge variant="outline">{metrics.readabilityLabel}</Badge>
        <Badge variant="outline">Grade {metrics.fleschKincaidGrade}</Badge>
        <Badge variant="outline">{metrics.readingTimeLabel}</Badge>
        {data.aiLikelihood >= 50 && (
          <Badge variant="warning">AI likelihood {data.aiLikelihood}%</Badge>
        )}
      </div>

      <p className="text-sm text-slate-600">{data.summary}</p>
      <p className="text-xs text-slate-500">
        Best for: {data.audienceFit} · {metrics.words} words · {metrics.sentences} sentences
        {metrics.longSentences > 0 && ` · ${metrics.longSentences} long sentence(s)`}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Strengths
          </p>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {data.topStrengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-500">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Improve next
          </p>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {data.topImprovements.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-500">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
