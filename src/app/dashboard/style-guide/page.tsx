"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { styleGuideSchema } from "@/lib/validations";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

interface StyleGuide {
  id: string;
  name: string;
  englishVariant: string;
  forbiddenWords: string[];
  preferredWords: string[];
  readingLevel: string | null;
}

export default function StyleGuidePage() {
  const [guides, setGuides] = useState<StyleGuide[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forbiddenRaw, setForbiddenRaw] = useState("");
  const [preferredRaw, setPreferredRaw] = useState("");

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(styleGuideSchema),
    defaultValues: { englishVariant: "US" as const, forbiddenWords: [] as string[], preferredWords: [] as string[] },
  });

  const load = () => fetch("/api/style-guide").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setGuides(d); });
  useEffect(() => { load(); }, []);

  const onSubmit = async (data: Record<string, unknown>) => {
    setError(null);
    const payload = {
      ...data,
      forbiddenWords: forbiddenRaw.split(",").map((s) => s.trim()).filter(Boolean),
      preferredWords: preferredRaw.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch("/api/style-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) { setError(result.error); return; }
    reset(); setShowForm(false); load();
  };

  const deleteGuide = async (id: string) => {
    if (!confirm("Delete this style guide?")) return;
    await fetch(`/api/style-guide/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <DashboardHeader title="Style Guide" description="Define spelling, tone, and compliance rules for your writing" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 flex justify-between">
          <p className="text-sm text-slate-600">Style guides are applied during grammar checks and AI analysis.</p>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> New Style Guide</Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Create Style Guide</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Name *</Label><Input {...register("name")} /></div>
                <div className="space-y-2">
                  <Label>English variant</Label>
                  <select {...register("englishVariant")} className="w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="US">US English</option>
                    <option value="UK">UK English</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2"><Label>Forbidden words (comma-separated)</Label><Input value={forbiddenRaw} onChange={(e) => setForbiddenRaw(e.target.value)} placeholder="utilize, synergy, leverage" /></div>
                <div className="space-y-2 md:col-span-2"><Label>Preferred words (comma-separated)</Label><Input value={preferredRaw} onChange={(e) => setPreferredRaw(e.target.value)} placeholder="use, collaborate" /></div>
                <div className="space-y-2"><Label>Reading level</Label><Input {...register("readingLevel")} placeholder="8th grade, professional" /></div>
                <div className="space-y-2"><Label>Sentence length preference</Label><Input {...register("sentenceLengthPref")} placeholder="Short, medium, varied" /></div>
                <div className="space-y-2 md:col-span-2"><Label>Capitalization rules</Label><Textarea {...register("capitalizationRules")} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Tone rules</Label><Textarea {...register("toneRules")} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Compliance rules</Label><Textarea {...register("complianceRules")} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Industry-specific rules</Label><Textarea {...register("industryRules")} /></div>
                {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" disabled={isSubmitting}>Create</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((g) => (
            <Card key={g.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{g.name}</CardTitle>
                    <CardDescription>{g.englishVariant} English</CardDescription>
                  </div>
                  {g.readingLevel && <Badge variant="secondary">{g.readingLevel}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteGuide(g.id)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
