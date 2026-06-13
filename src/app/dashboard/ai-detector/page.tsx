"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { FormattedTextInput } from "@/components/tools/formatted-text-input";
import { useFormattedContent } from "@/hooks/use-formatted-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, ScanSearch, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

const DISCLAIMER = "AI detection is probabilistic and may produce false positives or false negatives.";

interface DetectionResult {
  configured?: boolean;
  message?: string;
  error?: string;
  aiProbability?: number;
  humanProbability?: number;
  mixedEstimate?: number;
  summary?: string;
  provider?: string;
  highlights?: Array<{ text: string; aiProbability: number; reason?: string }>;
}

export default function AIDetectorPage() {
  const { plainText, onFormattedChange, isEmpty } = useFormattedContent();
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai-detection")
      .then((r) => r.json())
      .then((d) => setConfigured(d.providerConfigured));
  }, []);

  const detect = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/ai-detection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: plainText }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Analysis failed");
      return;
    }

    setResult(data);
  };

  const verdict =
    result?.aiProbability != null
      ? result.aiProbability >= 70
        ? "likely-ai"
        : result.aiProbability <= 30
          ? "likely-human"
          : "uncertain"
      : null;

  return (
    <>
      <DashboardHeader title="AI Detector" description="Estimate AI-generated content probability" />
      <div className="dashboard-content">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <p className="text-sm text-slate-600">{DISCLAIMER}</p>
        </div>

        {configured === false && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-700">
              AI detection requires <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> in your environment.
            </p>
          </div>
        )}

        {configured === true && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">
              AI detection is active via OpenAI. Results are estimates — not definitive proof.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card border-0">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-400" />
            <CardHeader>
              <CardTitle className="font-display">Paste content to analyze</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormattedTextInput onChange={onFormattedChange} minHeight="280px" />
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
              )}
              <Button
                onClick={detect}
                disabled={loading || isEmpty || plainText.trim().length < 20}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanSearch className="h-4 w-4" />
                )}
                Analyze Content
              </Button>
              <p className="text-xs text-slate-500">Minimum 20 characters required.</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Detection Results</CardTitle>
              {verdict && (
                <Badge
                  variant={
                    verdict === "likely-ai"
                      ? "destructive"
                      : verdict === "likely-human"
                        ? "success"
                        : "warning"
                  }
                >
                  {verdict === "likely-ai"
                    ? "Likely AI"
                    : verdict === "likely-human"
                      ? "Likely Human"
                      : "Mixed / Uncertain"}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {!result ? (
                <p className="py-16 text-center text-sm text-slate-500">
                  Analysis results will appear here
                </p>
              ) : result.configured === false ? (
                <p className="py-8 text-center text-sm text-slate-500">{result.message}</p>
              ) : (
                <div className="space-y-4">
                  {result.summary && (
                    <p className="rounded-xl bg-violet-50/80 p-4 text-sm leading-relaxed text-slate-700">
                      {result.summary}
                    </p>
                  )}
                  {[
                    ["AI Probability", result.aiProbability ?? 0, "text-red-600"],
                    ["Human Probability", result.humanProbability ?? 0, "text-emerald-600"],
                    ["Mixed Content", result.mixedEstimate ?? 0, "text-amber-600"],
                  ].map(([label, value, color]) => (
                    <div key={label as string}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{label as string}</span>
                        <span className={`font-bold ${color as string}`}>{value as number}%</span>
                      </div>
                      <Progress value={value as number} className="h-2" />
                    </div>
                  ))}
                  {result.highlights && result.highlights.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Flagged spans
                      </p>
                      {result.highlights.map((h, i) => (
                        <div key={i} className="rounded-xl border border-red-100 bg-red-50/80 p-3 text-sm">
                          <p className="text-slate-800">&ldquo;{h.text}&rdquo;</p>
                          <p className="mt-1 text-xs text-red-600">{h.aiProbability}% AI probability</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">{DISCLAIMER}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
