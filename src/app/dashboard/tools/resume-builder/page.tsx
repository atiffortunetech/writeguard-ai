"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileUser, Copy } from "lucide-react";

export default function ResumeBuilderPage() {
  const [form, setForm] = useState({
    name: "",
    title: "",
    experience: "",
    skills: "",
    education: "",
    summary: "",
  });
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/tools/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setResume(data.fullResume);
  };

  return (
    <>
      <DashboardHeader
        title="Resume Builder"
        description="Generate a professional resume with AI"
      />
      <div className="dashboard-content">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <FileUser className="h-5 w-5" /> Your Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["name", "Full name *"],
                ["title", "Job title / target role"],
                ["summary", "Professional summary (optional)"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Work experience *</Label>
                <Textarea
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  rows={5}
                  placeholder="Company, role, dates, achievements…"
                />
              </div>
              <div className="space-y-2">
                <Label>Skills</Label>
                <Input
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="e.g. Python, Project Management, SEO"
                />
              </div>
              <div className="space-y-2">
                <Label>Education</Label>
                <Input
                  value={form.education}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                onClick={generate}
                disabled={loading || !form.name || !form.experience}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Resume"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="flex flex-row justify-between">
              <CardTitle className="font-display">Resume Output</CardTitle>
              {resume && (
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(resume)}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!resume ? (
                <p className="py-16 text-center text-sm text-slate-500">
                  Your generated resume appears here
                </p>
              ) : (
                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-sans leading-relaxed">
                  {resume}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
