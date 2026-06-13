"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { FormattedTextInput } from "@/components/tools/formatted-text-input";
import { useFormattedContent } from "@/hooks/use-formatted-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Shield, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

const DISCLAIMER =
  "AI originality estimates are indicative — not a substitute for database plagiarism scanning.";

interface PlagiarismResult {
  configured?: boolean;
  message?: string;
  similarityScore?: number;
  summary?: string;
  disclaimer?: string;
  provider?: string;
  matchedSources?: Array<{
    url: string;
    title?: string;
    matchPercentage: number;
    matchedText?: string;
  }>;
  highlights?: Array<{ text: string }>;
}

export default function PlagiarismPage() {
  const { plainText, onFormattedChange, isEmpty } = useFormattedContent();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [history, setHistory] = useState<
    Array<{ id: string; similarityScore: number | null; createdAt: string }>
  >([]);

  useEffect(() => {
    fetch("/api/plagiarism")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.providerConfigured);
        setHistory(d.checks ?? []);
      });
  }, []);

  const check = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/plagiarism", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: plainText }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Plagiarism check failed");
      return;
    }

    setResult(data);
    if (data.configured) setConfigured(true);
  };

  const score = result?.similarityScore ?? 0;
  const verdict =
    score >= 60 ? "high" : score >= 30 ? "moderate" : "low";

  return (
    <>
      <DashboardHeader title="Plagiarism Check" description="Verify content originality" />
      <div className="dashboard-content">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <p className="text-sm text-slate-600">{DISCLAIMER}</p>
        </div>

        {configured === false && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Provider not configured</p>
              <p className="text-sm text-amber-700">
                Set <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> in your
                environment to enable AI-powered originality checks.
              </p>
            </div>
          </div>
        )}

        {configured === true && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">
              Originality analysis is active via OpenAI. Results estimate how generic or commonly
              duplicated your text appears.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card border-0">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-400" />
            <CardHeader>
              <CardTitle className="font-display">Paste content to check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormattedTextInput onChange={onFormattedChange} minHeight="280px" />
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
              )}
              <Button
                onClick={check}
                disabled={loading || isEmpty || plainText.trim().length < 20}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Check Plagiarism
              </Button>
              <p className="text-xs text-slate-500">Minimum 20 characters required.</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display">Results</CardTitle>
                {result?.configured === true && (
                  <Badge
                    variant={
                      verdict === "high"
                        ? "destructive"
                        : verdict === "moderate"
                          ? "warning"
                          : "success"
                    }
                  >
                    {verdict === "high"
                      ? "High similarity"
                      : verdict === "moderate"
                        ? "Moderate similarity"
                        : "Likely original"}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {!result ? (
                  <p className="py-16 text-center text-sm text-slate-500">
                    {loading ? "Analyzing originality…" : "Results will appear here"}
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Similarity Score</span>
                      <span className="text-2xl font-bold text-red-600">{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />

                    {result.matchedSources && result.matchedSources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Flagged patterns
                        </p>
                        {result.matchedSources.map((s, i) => (
                          <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-sm">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="font-medium text-slate-800">
                                {s.title || s.url}
                              </p>
                              <Badge variant="warning">{s.matchPercentage}% match</Badge>
                            </div>
                            {s.matchedText && (
                              <p className="text-slate-600">&ldquo;{s.matchedText}&rdquo;</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {result.highlights && result.highlights.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Highlighted phrases
                        </p>
                        {result.highlights.map((h, i) => (
                          <div key={i} className="rounded-xl border border-red-100 bg-red-50/80 p-3 text-sm">
                            &ldquo;{h.text}&rdquo;
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      {result.disclaimer || DISCLAIMER}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {history.length > 0 && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="font-display text-sm">Recent Checks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex justify-between text-sm">
                      <span>
                        {h.similarityScore != null
                          ? `${h.similarityScore}% similar`
                          : "Pending"}
                      </span>
                      <span className="text-slate-500">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
