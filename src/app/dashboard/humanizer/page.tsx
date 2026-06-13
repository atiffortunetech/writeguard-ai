"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { AnimateIn } from "@/components/ui/animate-in";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Wand2,
  Save,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Shield,
} from "lucide-react";
import {
  HUMANIZER_MODES,
  HUMANIZE_INTENSITY_META,
  type HumanizeIntensity,
} from "@/prompts/humanizer";

const SCENE_MODES = Object.entries(HUMANIZER_MODES);

export default function HumanizerPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [mode, setMode] = useState("amazon_seller");
  const [intensity, setIntensity] = useState<HumanizeIntensity>("enhanced");
  const [preserveFormat, setPreserveFormat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    humanizedText: string;
    explanation: string;
    changesSummary: string[];
    humanScore?: number;
    passesUsed?: number;
  } | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const humanize = async (sourceText?: string) => {
    const input = sourceText ?? text;
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    if (!sourceText) setResult(null);

    const res = await fetch("/api/ai/humanize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input, mode, intensity, preserveFormat }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Humanization failed");
      return;
    }
    setResult(data);
  };

  const humanizeAgain = () => {
    if (!result?.humanizedText) return;
    humanize(result.humanizedText);
  };

  const save = async () => {
    if (!result) return;
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Humanized Content",
        content: `<p>${result.humanizedText.replace(/\n/g, "</p><p>")}</p>`,
        plainText: result.humanizedText,
      }),
    });
    const doc = await res.json();
    if (res.ok) router.push(`/dashboard/editor/${doc.id}`);
  };

  const copyOutput = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.humanizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <DashboardHeader
        title="AI Humanizer"
        description="Transform AI text into natural human writing — powered by your own OpenAI key"
      />
      <div className="dashboard-content">
        <AnimateIn>
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200/60 bg-gradient-to-r from-violet-50/80 to-cyan-50/50 p-4">
            <Shield className="h-5 w-5 shrink-0 text-violet-600" />
            <p className="text-sm text-slate-700">
              Same workflow as premium humanizer tools: paste AI text → choose{" "}
              <strong>Enhanced</strong> → humanize → use <strong>Humanize Again</strong> if
              needed. No third-party API — runs on your{" "}
              <code className="rounded bg-white/80 px-1 text-xs">OPENAI_API_KEY</code>.
              For best results add{" "}
              <code className="rounded bg-white/80 px-1 text-xs">OPENAI_HUMANIZER_MODEL=gpt-4o</code>.
            </p>
          </div>
        </AnimateIn>

        {/* Intensity — matches aihumanize Quality / Balanced / Enhanced */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {(Object.entries(HUMANIZE_INTENSITY_META) as [HumanizeIntensity, typeof HUMANIZE_INTENSITY_META.enhanced][]).map(
            ([key, meta]) => {
              const active = intensity === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIntensity(key)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                    active
                      ? "border-violet-400 bg-violet-50/80 shadow-lg shadow-violet-100"
                      : "border-violet-100 bg-white/80 hover:border-violet-200"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-slate-900">
                      {meta.label}
                    </span>
                    {key === "enhanced" && (
                      <Badge className="text-[10px]">Like aihumanize.io</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{meta.description}</p>
                  <p className="mt-2 text-[10px] text-violet-500">
                    {meta.passes} pass{meta.passes > 1 ? "es" : ""}
                    {meta.chunk ? " · chunked processing" : ""}
                  </p>
                </button>
              );
            }
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnimateIn direction="right">
            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-400" />
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display">AI Text Input</CardTitle>
                <span className="text-xs text-slate-400">{wordCount} words</span>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Scene / style</Label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="w-full rounded-xl border border-violet-100 bg-white/90 px-3 py-2.5 text-sm input-glow"
                    >
                      {SCENE_MODES.map(([k, v]) => (
                        <option key={k} value={k}>
                          {k.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-violet-100 bg-white/80 px-4 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={preserveFormat}
                        onChange={(e) => setPreserveFormat(e.target.checked)}
                        className="rounded border-violet-300"
                      />
                      Preserve format (headings, bullets)
                    </label>
                  </div>
                </div>

                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={16}
                  placeholder="Paste your ChatGPT / AI-generated text here…"
                  className="min-h-[320px] font-mono text-sm leading-relaxed"
                />

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                )}

                <Button
                  onClick={() => humanize()}
                  disabled={loading || !text.trim()}
                  className="h-12 w-full text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Humanizing… ({HUMANIZE_INTENSITY_META[intensity].label} mode)
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      Humanize AI Text
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </AnimateIn>

          <AnimateIn direction="left" delay={100}>
            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display">Human Output</CardTitle>
                {result && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={humanizeAgain} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      Humanize Again
                    </Button>
                    <Button size="sm" variant="outline" onClick={copyOutput}>
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" onClick={save}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Sparkles className="mb-4 h-12 w-12 text-violet-300 animate-float" />
                    <p className="font-display font-semibold text-slate-700">
                      100% human text appears here
                    </p>
                    <p className="mt-2 max-w-xs text-sm text-slate-500">
                      Select Enhanced mode for the strongest rewrite — same idea as aihumanize.io.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-scale-in">
                    {result.humanScore !== undefined && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">
                            Human-likeness score
                          </span>
                          <span className="font-display text-xl font-bold text-emerald-600">
                            {result.humanScore}%
                          </span>
                        </div>
                        <Progress value={result.humanScore} className="h-2" />
                        <p className="mt-2 text-xs text-slate-500">
                          {result.passesUsed} AI passes · If Copyleaks still flags it, click{" "}
                          <strong>Humanize Again</strong>
                        </p>
                      </div>
                    )}

                    <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-emerald-100 bg-white p-5 text-sm leading-relaxed text-slate-800">
                      {result.humanizedText}
                    </div>

                    <p className="text-sm text-slate-600">{result.explanation}</p>

                    {result.changesSummary?.length > 0 && (
                      <ul className="space-y-1 text-xs text-slate-500">
                        {result.changesSummary.map((c, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-violet-400">•</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    )}
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
