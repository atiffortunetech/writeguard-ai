"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { AnimateIn } from "@/components/ui/animate-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { getToolBySlug } from "@/lib/tools-registry";
import { FormattedTextInput } from "@/components/tools/formatted-text-input";
import { FormattedTextOutput } from "@/components/tools/formatted-text-output";
import { useFormattedContent } from "@/hooks/use-formatted-content";
import { Float3D } from "@/components/ui/float-3d";

interface ToolResult {
  result: string;
  resultHtml?: string;
  summary?: string;
  items?: Array<{ label: string; detail: string; severity?: string }>;
  scores?: Record<string, number>;
}

export function TextToolPage({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);
  const { onFormattedChange, requestBody, isEmpty, hasFormatting } = useFormattedContent();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<ToolResult | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/tools/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody({ tool: slug })),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setOutput(data);
  };

  if (!tool) return null;

  const Icon = tool.icon;

  return (
    <>
      <DashboardHeader title={tool.title} description={tool.description} />
      <div className="dashboard-content">
        <div className="grid gap-6 lg:grid-cols-2">
          <AnimateIn direction="right">
            <Float3D autoFloat intensity={12}>
            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-400" />
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Icon className="h-5 w-5 text-violet-500" />
                  Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormattedTextInput onChange={onFormattedChange} />
                {hasFormatting && (
                  <p className="text-xs text-violet-600">
                    Formatted content detected — headings & bold will be preserved in output.
                  </p>
                )}
                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                )}
                <Button onClick={run} disabled={loading || isEmpty} className="h-11 w-full">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    tool.actionLabel ?? "Run"
                  )}
                </Button>
              </CardContent>
            </Card>
            </Float3D>
          </AnimateIn>

          <AnimateIn direction="left" delay={100}>
            <Float3D autoFloat intensity={12}>
            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
              <CardHeader>
                <CardTitle className="font-display">Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!output ? (
                  <FormattedTextOutput emptyMessage="Results appear here" />
                ) : (
                  <div className="space-y-4">
                    {output.scores && Object.keys(output.scores).length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(output.scores).map(([k, v]) => (
                          <div key={k} className="rounded-xl border border-violet-100 p-3">
                            <p className="text-xs capitalize text-slate-500">{k}</p>
                            <p className="font-display text-xl font-bold text-violet-600">{v}</p>
                            <Progress value={v} className="mt-1 h-1.5" />
                          </div>
                        ))}
                      </div>
                    )}
                    {output.summary && (
                      <p className="text-sm text-slate-600">{output.summary}</p>
                    )}
                    {output.result && tool.slug !== "grammar-checker" && (
                      <FormattedTextOutput
                        result={output.result}
                        resultHtml={output.resultHtml}
                      />
                    )}
                    {output.items && output.items.length > 0 && (
                      <ul className="max-h-[400px] space-y-2 overflow-y-auto">
                        {output.items.map((item, i) => (
                          <li
                            key={i}
                            className="rounded-xl border border-violet-100/80 bg-white/80 p-3 text-sm"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <Badge variant="secondary">{item.label}</Badge>
                              {item.severity && (
                                <Badge
                                  variant={
                                    item.severity === "high"
                                      ? "destructive"
                                      : item.severity === "medium"
                                        ? "warning"
                                        : "secondary"
                                  }
                                >
                                  {item.severity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-600">{item.detail}</p>
                          </li>
                        ))}
                      </ul>
                    )}
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
