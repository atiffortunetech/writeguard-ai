"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { AnimateIn } from "@/components/ui/animate-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { SMART_REWRITE_MODES } from "@/lib/smart-rewrite-modes";
import type { SmartRewriteModeId } from "@/lib/smart-rewrite-modes";
import { FormattedTextInput } from "@/components/tools/formatted-text-input";
import { FormattedTextOutput } from "@/components/tools/formatted-text-output";
import { useFormattedContent } from "@/hooks/use-formatted-content";

export default function SmartRewritePage() {
  const { onFormattedChange, requestBody, isEmpty, hasFormatting } = useFormattedContent();
  const [mode, setMode] = useState<SmartRewriteModeId>("professional");
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
    const res = await fetch("/api/tools/smart-rewrite", {
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

  return (
    <>
      <DashboardHeader
        title="Smart Rewrite"
        description="8 rewrite modes — preserves headings, bold & structure from Google Docs"
      />
      <div className="dashboard-content">
        <Badge className="mb-6 bg-violet-100 text-violet-800">Pro · 8 advanced modes</Badge>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnimateIn direction="right">
            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-400" />
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-violet-500" />
                  Input & mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {SMART_REWRITE_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        mode === m.id
                          ? "border-violet-400 bg-violet-50 text-violet-800"
                          : "border-violet-100 text-slate-600 hover:bg-violet-50/50"
                      }`}
                    >
                      <span className="font-semibold">{m.label}</span>
                      <span className="mt-0.5 block text-slate-500">{m.description}</span>
                    </button>
                  ))}
                </div>
                <FormattedTextInput onChange={onFormattedChange} />
                {hasFormatting && (
                  <p className="text-xs text-violet-600">Document formatting will be preserved.</p>
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
                    `Rewrite — ${SMART_REWRITE_MODES.find((m) => m.id === mode)?.label}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </AnimateIn>

          <AnimateIn direction="left" delay={100}>
            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
              <CardHeader>
                <CardTitle className="font-display">Output</CardTitle>
              </CardHeader>
              <CardContent>
                {!output ? (
                  <FormattedTextOutput emptyMessage="Rewritten text appears here" />
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
          </AnimateIn>
        </div>
      </div>
    </>
  );
}
