"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Shield, AlertTriangle } from "lucide-react";

interface PlagiarismResult {
  configured?: boolean;
  message?: string;
  similarityScore?: number;
  matchedSources?: Array<{ url: string; matchPercentage: number }>;
}

export default function PlagiarismPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; similarityScore: number | null; createdAt: string }>>([]);

  useEffect(() => {
    fetch("/api/plagiarism").then((r) => r.json()).then((d) => {
      setConfigured(d.providerConfigured);
      setHistory(d.checks ?? []);
    });
  }, []);

  const check = async () => {
    setLoading(true);
    const res = await fetch("/api/plagiarism", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setLoading(false);
    setResult(data);
    if (data.configured) setConfigured(true);
  };

  return (
    <>
      <DashboardHeader title="Plagiarism Check" description="Verify content originality" />
      <div className="dashboard-content">
        {configured === false && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Provider not configured</p>
              <p className="text-sm text-amber-700">Connect Copyleaks or another plagiarism provider by setting COPYLEAKS_API_KEY in your environment.</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Paste content to check</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder="Paste your content here..." />
              <Button onClick={check} disabled={loading || !text.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Check Plagiarism
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {result && result.configured === false && (
              <Card><CardContent className="py-8 text-center text-sm text-slate-500">{result.message}</CardContent></Card>
            )}
            {result?.configured === true && (
              <Card>
                <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center justify-between">
                    <span>Similarity Score</span>
                    <span className="text-2xl font-bold text-red-600">{result.similarityScore ?? 0}%</span>
                  </div>
                  <Progress value={result.similarityScore ?? 0} className="mb-4" />
                  {result.matchedSources?.map((s, i) => (
                    <div key={i} className="mb-2 rounded border p-3 text-sm">
                      <p className="font-medium">{s.url}</p>
                      <Badge variant="warning">{s.matchPercentage}% match</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {history.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Recent Checks</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex justify-between text-sm">
                      <span>{h.similarityScore != null ? `${h.similarityScore}% similar` : "Pending"}</span>
                      <span className="text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</span>
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
