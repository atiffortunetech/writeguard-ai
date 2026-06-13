"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { AnimateIn } from "@/components/ui/animate-in";
import { Float3D } from "@/components/ui/float-3d";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { PARAPHRASE_MODES } from "@/lib/paraphrase-modes";
import type { ParaphraseModeId } from "@/lib/paraphrase-modes";
import { FormattedTextInput } from "@/components/tools/formatted-text-input";
import { FormattedTextOutput } from "@/components/tools/formatted-text-output";
import { useFormattedContent } from "@/hooks/use-formatted-content";

export default function ParaphrasePage() {
  const { onFormattedChange, requestBody, isEmpty, hasFormatting } = useFormattedContent();
  const [mode, setMode] = useState<ParaphraseModeId>("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<{
    result: string;
    resultHtml?: string;
    summary: string;
  } | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/tools/paraphrase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody({ mode })),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setOutput(data);
  };

  const activeMode = PARAPHRASE_MODES.find((m) => m.id === mode);

  return (
    <>
      <DashboardHeader
        title="Paraphrasing Tool"
        description="Rephrase any text in 6 styles — same meaning, fresh wording (QuillBot-style)"
      />
      <div className="dashboard-content">
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge className="bg-violet-100 text-violet-800">Pro · 6 paraphrase modes</Badge>
          <Badge variant="outline">Preserves meaning</Badge>
          <Badge variant="outline">Preserves headings & bold</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnimateIn direction="right">
            <Float3D>
              <Card className="glass-card border-0">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-base sm:text-lg">
                    <RefreshCw className="h-5 w-5 shrink-0 text-violet-500" />
                    Your text
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PARAPHRASE_MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors sm:px-3 ${
                          mode === m.id
                            ? "border-violet-400 bg-violet-50 text-violet-800"
                            : "border-violet-100 text-slate-600 hover:bg-violet-50/50"
                        }`}
                      >
                        <span className="font-semibold">{m.label}</span>
                        <span className="mt-0.5 block text-[10px] text-slate-500 sm:text-xs">
                          {m.description}
                        </span>
                      </button>
                    ))}
                  </div>
                  <FormattedTextInput onChange={onFormattedChange} />
                  {hasFormatting && (
                    <p className="text-xs text-violet-600">
                      H1–H6, bold & paragraphs will be kept in the paraphrased output.
                    </p>
                  )}
                  {error && (
                    <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                  )}
                  <Button
                    onClick={run}
                    disabled={loading || isEmpty}
                    className="btn-glow w-full border-0 text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Paraphrase — ${activeMode?.label ?? "Standard"}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            </Float3D>
          </AnimateIn>

          <AnimateIn direction="left" delay={100}>
            <Float3D>
              <Card className="glass-card border-0">
                <div className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
                <CardHeader>
                  <CardTitle className="font-display text-base sm:text-lg">Paraphrased output</CardTitle>
                </CardHeader>
                <CardContent>
                  {!output ? (
                    <FormattedTextOutput emptyMessage="Your paraphrased text will appear here" />
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">{output.summary}</p>
                      <FormattedTextOutput
                        result={output.result}
                        resultHtml={output.resultHtml}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Float3D>
          </AnimateIn>
        </div>
      </div>
    </>
  );
}
