"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, ShoppingBag, Save, Sparkles, Package, Tag } from "lucide-react";

interface AmazonResult {
  seoTitle: string;
  bullets: string[];
  description: string;
  backendSearchTerms: string;
  keywordCoverageScore: number;
  coveredKeywords: string[];
  missingKeywords: string[];
  improvementNotes: string[];
}

export default function AmazonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AmazonResult | null>(null);
  const [form, setForm] = useState({
    productName: "", brandName: "", features: "", targetAudience: "",
    mainKeywords: "", competitorNotes: "", wordsToAvoid: "", tone: "Professional", marketplace: "US",
  });

  const generate = async () => {
    setLoading(true); setError(null);
    const res = await fetch("/api/ai/amazon-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setResult(data);
  };

  const saveListing = async () => {
    if (!result) return;
    const text = [
      result.seoTitle, "", ...result.bullets.map((b) => `• ${b}`),
      "", result.description, "", `Backend terms: ${result.backendSearchTerms}`,
    ].join("\n");
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Amazon: ${form.productName}`, content: `<pre>${text}</pre>`, plainText: text }),
    });
    const doc = await res.json();
    if (res.ok) router.push(`/dashboard/editor/${doc.id}`);
  };

  const copyField = (text: string) => navigator.clipboard.writeText(text);

  return (
    <>
      <DashboardHeader title="Amazon Listing Optimizer" description="Generate SEO-optimized Amazon product listings" />
      <div className="dashboard-content">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="glass-card overflow-hidden border-0">
              <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400" />
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-xl">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg">
                    <Package className="h-4 w-4" />
                  </div>
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  ["productName", "Product name *"],
                  ["brandName", "Brand name"],
                  ["mainKeywords", "Main keywords *"],
                  ["targetAudience", "Target audience"],
                  ["marketplace", "Marketplace"],
                  ["tone", "Tone"],
                  ["wordsToAvoid", "Words to avoid"],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-slate-600">{label}</Label>
                    <Input
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label className="text-slate-600">Product features *</Label>
                  <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Competitor notes</Label>
                  <Textarea value={form.competitorNotes} onChange={(e) => setForm({ ...form, competitorNotes: e.target.value })} rows={2} />
                </div>
                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                )}
                <Button
                  onClick={generate}
                  disabled={loading || !form.productName}
                  className="w-full h-12 text-base"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                  {loading ? "Generating listing..." : "Generate Listing"}
                </Button>
              </CardContent>
            </Card>

          <div className="space-y-4">
            {!result ? (
              <Card className="glass-card border-0 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
                      <ShoppingBag className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="font-display text-lg font-semibold text-slate-700">
                      Your listing awaits
                    </p>
                    <p className="mt-2 max-w-xs text-sm text-slate-500">
                      Fill in your product details and hit Generate to see SEO-optimized copy here.
                    </p>
                  </CardContent>
                </Card>
            ) : (
              <>
                <Card className="glass-card border-0 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-400" />
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="font-display flex items-center gap-2">
                        <Tag className="h-4 w-4 text-violet-500" />
                        Keyword Coverage
                      </CardTitle>
                      <span className="font-display text-3xl font-bold gradient-text">
                        {result.keywordCoverageScore}%
                      </span>
                    </CardHeader>
                    <CardContent>
                      <Progress value={result.keywordCoverageScore} className="mb-4 h-2" />
                      <div className="flex flex-wrap gap-2">
                        {result.coveredKeywords.map((k) => (
                          <Badge key={k} variant="success">{k}</Badge>
                        ))}
                        {result.missingKeywords.map((k) => (
                          <Badge key={k} variant="warning">{k} (missing)</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                <Card className="glass-card border-0">
                    <CardHeader className="flex flex-row justify-between">
                      <CardTitle className="font-display">Listing Output</CardTitle>
                      <Button size="sm" variant="outline" onClick={saveListing}>
                        <Save className="h-4 w-4" /> Save to Editor
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      {[
                        { label: `SEO Title (${result.seoTitle.length}/200)`, value: result.seoTitle },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <Label className="text-slate-500">{label}</Label>
                          <div
                            className="group mt-1 cursor-pointer rounded-xl bg-gradient-to-br from-violet-50/80 to-cyan-50/50 p-4 transition-all hover:shadow-md"
                            onClick={() => copyField(value)}
                            title="Click to copy"
                          >
                            <p className="font-medium text-slate-800">{value}</p>
                            <p className="mt-1 text-xs text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                              Click to copy
                            </p>
                          </div>
                        </div>
                      ))}
                      <div>
                        <Label className="text-slate-500">Bullet Points</Label>
                        {result.bullets.map((b, i) => (
                          <div
                            key={i}
                            className="group mt-2 cursor-pointer rounded-xl bg-white/80 border border-violet-100/60 p-3 transition-all hover:border-violet-200 hover:shadow-sm"
                            onClick={() => copyField(b)}
                          >
                            <p className="text-slate-800">• {b}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label className="text-slate-500">Description</Label>
                        <p
                          className="mt-1 cursor-pointer whitespace-pre-wrap rounded-xl bg-white/80 border border-violet-100/60 p-4 text-slate-800 transition-all hover:border-violet-200"
                          onClick={() => copyField(result.description)}
                        >
                          {result.description}
                        </p>
                      </div>
                      <div>
                        <Label className="text-slate-500">Backend Search Terms</Label>
                        <p
                          className="mt-1 cursor-pointer rounded-xl bg-slate-900/5 p-3 font-mono text-xs text-slate-700"
                          onClick={() => copyField(result.backendSearchTerms)}
                        >
                          {result.backendSearchTerms}
                        </p>
                      </div>
                      {result.improvementNotes.length > 0 && (
                        <div>
                          <Label className="text-slate-500">Improvement Notes</Label>
                          <ul className="mt-2 space-y-1">
                            {result.improvementNotes.map((n, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-600">
                                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-violet-400" />
                                {n}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
