"use client";

import { useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { FormattedTextInput } from "@/components/tools/formatted-text-input";
import { useFormattedContent } from "@/hooks/use-formatted-content";
import { Float3D } from "@/components/ui/float-3d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeTextStats } from "@/lib/text-stats";
import { getToolBySlug } from "@/lib/tools-registry";

export function CounterToolPage({
  slug,
  focus,
}: {
  slug: string;
  focus: "words" | "characters" | "paragraphs" | "sentences";
}) {
  const tool = getToolBySlug(slug);
  const { plainText, onFormattedChange } = useFormattedContent();
  const stats = useMemo(() => computeTextStats(plainText), [plainText]);

  if (!tool) return null;

  const Icon = tool.icon;

  const highlights: Record<string, { label: string; value: number | string; sub?: string }[]> = {
    words: [
      { label: "Words", value: stats.words },
      { label: "Characters", value: stats.characters },
      { label: "Reading time", value: `${stats.readingTimeMinutes} min` },
      { label: "Speaking time", value: `${stats.speakingTimeMinutes} min` },
    ],
    characters: [
      { label: "Characters", value: stats.characters },
      { label: "Without spaces", value: stats.charactersNoSpaces },
      { label: "Words", value: stats.words },
    ],
    paragraphs: [
      { label: "Paragraphs", value: stats.paragraphs },
      { label: "Words", value: stats.words },
      { label: "Avg words / paragraph", value: stats.paragraphs ? Math.round(stats.words / stats.paragraphs) : 0 },
    ],
    sentences: [
      { label: "Sentences", value: stats.sentences },
      { label: "Words", value: stats.words },
      { label: "Avg words / sentence", value: stats.sentences ? Math.round(stats.words / stats.sentences) : 0 },
    ],
  };

  return (
    <>
      <DashboardHeader title={tool.title} description={tool.description} />
      <div className="dashboard-content">
        <div className="grid gap-6 lg:grid-cols-2">
          <Float3D autoFloat intensity={10}>
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-display">Your text</CardTitle>
            </CardHeader>
            <CardContent>
              <FormattedTextInput onChange={onFormattedChange} minHeight="320px" />
            </CardContent>
          </Card>
          </Float3D>

          <Float3D autoFloat intensity={10}>
          <Card className="glass-card border-0">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-400" />
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Icon className="h-5 w-5 text-violet-500" />
                Counts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {highlights[focus].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-6 text-center"
                  >
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="font-display mt-2 text-4xl font-bold gradient-text">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-500">
                <span>Characters: {stats.characters}</span>
                <span>Words: {stats.words}</span>
                <span>Sentences: {stats.sentences}</span>
                <span>Paragraphs: {stats.paragraphs}</span>
              </div>
            </CardContent>
          </Card>
          </Float3D>
        </div>
      </div>
    </>
  );
}
