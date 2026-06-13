"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Save } from "lucide-react";

interface TemplateField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  fields: TemplateField[];
  isPremium: boolean;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTemplates(data); });
  }, []);

  const selectTemplate = (t: Template) => {
    setSelected(t);
    setInputs({});
    setOutput("");
    setError(null);
  };

  const generate = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/templates/${selected.slug}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Generation failed");
      return;
    }
    setOutput(data.content);
  };

  const saveToDocument = async () => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: selected?.name ?? "Generated Content",
        content: `<p>${output.replace(/\n/g, "</p><p>")}</p>`,
        plainText: output,
      }),
    });
    const doc = await res.json();
    if (res.ok) router.push(`/dashboard/editor/${doc.id}`);
  };

  const categories = [...new Set(templates.map((t) => t.category))];

  return (
    <>
      <DashboardHeader title="Content Templates" description="Generate content with AI-powered templates" />
      <div className="dashboard-content">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="mb-2 text-sm font-semibold text-slate-500 uppercase">{cat}</h3>
                <div className="space-y-2">
                  {templates.filter((t) => t.category === cat).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => selectTemplate(t)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selected?.id === t.id ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{t.name}</span>
                        {t.isPremium && <Badge variant="secondary">Pro</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {!selected ? (
              <Card><CardContent className="py-12 text-center text-sm text-slate-500">Select a template to get started</CardContent></Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{selected.name}</CardTitle>
                    <CardDescription>{selected.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(selected.fields as TemplateField[]).map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label>{field.label}{field.required && " *"}</Label>
                        {field.type === "textarea" ? (
                          <Textarea
                            value={inputs[field.name] ?? ""}
                            onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value })}
                          />
                        ) : (
                          <Input
                            value={inputs[field.name] ?? ""}
                            onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button onClick={generate} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate
                    </Button>
                  </CardContent>
                </Card>

                {output && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Output</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(output)}>
                          <Copy className="h-4 w-4" /> Copy
                        </Button>
                        <Button size="sm" onClick={saveToDocument}><Save className="h-4 w-4" /> Save to Document</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">{output}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
