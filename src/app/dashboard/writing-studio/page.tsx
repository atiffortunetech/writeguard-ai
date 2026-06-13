"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/header";
import { AnimateIn } from "@/components/ui/animate-in";
import { Float3D } from "@/components/ui/float-3d";
import { Button } from "@/components/ui/button";
import { FormattedTextInput } from "@/components/tools/formatted-text-input";
import { useFormattedContent } from "@/hooks/use-formatted-content";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  ScanSearch,
  Languages,
  Wand2,
  RefreshCw,
  ArrowRight,
  Brain,
  ClipboardList,
} from "lucide-react";
import { WritingIntelligencePanel } from "@/components/writing/writing-intelligence-panel";
import type { WritingIntelligenceResult } from "@/lib/run-writing-intelligence";

const QUICK_ACTIONS = [
  { href: "/dashboard/tools/sop-reports", label: "SOP & Reports", icon: ClipboardList },
  { href: "/dashboard/tools/smart-rewrite", label: "Smart Rewrite", icon: RefreshCw },
  { href: "/dashboard/humanizer", label: "Humanizer", icon: Wand2 },
  { href: "/dashboard/ai-detector", label: "AI Detector", icon: ScanSearch },
  { href: "/dashboard/tools/translator", label: "Translator", icon: Languages },
  { href: "/dashboard/tools/grammar-checker", label: "Grammar", icon: Sparkles },
];

const AUDIENCE_PRESETS = [
  "General",
  "Students",
  "Business professionals",
  "Marketing",
  "Academic",
  "E-commerce",
];

export default function WritingStudioPage() {
  const { plainText, onFormattedChange } = useFormattedContent();
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WritingIntelligenceResult | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/writing/intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: plainText, audience: audience || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Analysis failed");
      return;
    }
    setResult(data);
  };

  return (
    <>
      <DashboardHeader
        title="Writing Studio"
        description="One scan — grammar, clarity, readability, tone, and AI likelihood (beyond basic checkers)"
      />
      <div className="dashboard-content">
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge className="bg-violet-100 text-violet-800">Advanced vs Grammarly</Badge>
          <Badge variant="outline">Flesch readability</Badge>
          <Badge variant="outline">AI likelihood score</Badge>
          <Badge variant="outline">Audience targeting</Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="space-y-6 xl:col-span-2">
            <AnimateIn direction="right">
              <Float3D>
              <Card className="glass-card border-0">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-base">
                    <Brain className="h-5 w-5 text-violet-500" />
                    Your text
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target audience (optional)</Label>
                    <Input
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g. University students, Amazon sellers…"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {AUDIENCE_PRESETS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAudience(a)}
                          className="rounded-full border border-violet-100 px-2.5 py-0.5 text-xs hover:bg-violet-50"
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <FormattedTextInput onChange={onFormattedChange} minHeight="320px" />
                  {error && (
                    <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                  )}
                  <Button
                    onClick={analyze}
                    disabled={loading || plainText.trim().length < 10}
                    className="btn-glow h-11 w-full border-0 text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Run full intelligence scan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              </Float3D>
            </AnimateIn>

            <Float3D>
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="font-display text-sm">Fix with one click</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Button
                      key={a.href}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      asChild
                    >
                      <Link href={a.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-violet-500" />
                        {a.label}
                        <ArrowRight className="ml-auto h-3 w-3 opacity-50" />
                      </Link>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
            </Float3D>
          </div>

          <div className="xl:col-span-3">
            <AnimateIn direction="left" delay={100}>
              <Float3D>
              <Card className="glass-card border-0">
                <div className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
                <CardHeader>
                  <CardTitle className="font-display">Intelligence report</CardTitle>
                </CardHeader>
                <CardContent>
                  {!result ? (
                    <div className="py-20 text-center text-sm text-slate-500">
                      <Brain className="mx-auto mb-4 h-12 w-12 text-violet-200" />
                      <p>Scores, readability, tone, and improvement tips appear here.</p>
                      <p className="mt-2 text-xs">
                        Competitors usually split this across separate tools — WriteGuard combines
                        them in one scan.
                      </p>
                    </div>
                  ) : (
                    <WritingIntelligencePanel data={result} />
                  )}
                </CardContent>
              </Card>
              </Float3D>
            </AnimateIn>
          </div>
        </div>
      </div>
    </>
  );
}
