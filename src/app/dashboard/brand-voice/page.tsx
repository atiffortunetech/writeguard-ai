"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { brandVoiceSchema, type BrandVoiceInput } from "@/lib/validations";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

interface BrandVoice {
  id: string;
  name: string;
  brandName: string | null;
  tone: string | null;
  targetAudience: string | null;
  industry: string | null;
  isDefault: boolean;
}

export default function BrandVoicePage() {
  const [voices, setVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(brandVoiceSchema),
    defaultValues: {
      name: "",
      wordsToUse: [] as string[],
      wordsToAvoid: [] as string[],
      isDefault: false,
    },
  });

  const fetchVoices = async () => {
    const res = await fetch("/api/brand-voice");
    const data = await res.json();
    if (Array.isArray(data)) setVoices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const onSubmit = async (data: BrandVoiceInput) => {
    setError(null);
    const res = await fetch("/api/brand-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        wordsToUse: data.wordsToUse?.filter(Boolean) ?? [],
        wordsToAvoid: data.wordsToAvoid?.filter(Boolean) ?? [],
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Failed to create brand voice");
      return;
    }

    reset();
    setShowForm(false);
    fetchVoices();
  };

  const deleteVoice = async (id: string) => {
    if (!confirm("Delete this brand voice?")) return;
    await fetch(`/api/brand-voice/${id}`, { method: "DELETE" });
    fetchVoices();
  };

  return (
    <>
      <DashboardHeader
        title="Brand Voice"
        description="Define how your brand should sound across all content"
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Create brand voice profiles to score and align your writing.
          </p>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            New Brand Voice
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create Brand Voice</CardTitle>
              <CardDescription>
                Define tone, vocabulary, and style rules for your brand.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Profile name *</Label>
                  <Input id="name" {...register("name")} placeholder="Acme Brand Voice" />
                  {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand name</Label>
                  <Input id="brandName" {...register("brandName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Input id="tone" {...register("tone")} placeholder="Authoritative, warm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" {...register("industry")} placeholder="SaaS, E-commerce" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="targetAudience">Target audience</Label>
                  <Textarea id="targetAudience" {...register("targetAudience")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="writingStyle">Writing style</Label>
                  <Textarea id="writingStyle" {...register("writingStyle")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="exampleContent">Example content</Label>
                  <Textarea id="exampleContent" {...register("exampleContent")} rows={4} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="personality">Brand personality</Label>
                  <Textarea id="personality" {...register("personality")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contentGoals">Content goals</Label>
                  <Textarea id="contentGoals" {...register("contentGoals")} />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input type="checkbox" id="isDefault" {...register("isDefault")} />
                  <Label htmlFor="isDefault">Set as default brand voice</Label>
                </div>
                {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Brand Voice"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading brand voices...</p>
        ) : voices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-sm text-slate-500">
                No brand voices yet. Create one to align your writing with your brand.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Create Brand Voice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {voices.map((voice) => (
              <Card key={voice.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{voice.name}</CardTitle>
                      {voice.brandName && (
                        <CardDescription>{voice.brandName}</CardDescription>
                      )}
                    </div>
                    {voice.isDefault && <Badge>Default</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  {voice.tone && (
                    <p className="mb-1 text-sm text-slate-600">
                      <span className="font-medium">Tone:</span> {voice.tone}
                    </p>
                  )}
                  {voice.industry && (
                    <p className="mb-4 text-sm text-slate-600">
                      <span className="font-medium">Industry:</span> {voice.industry}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => deleteVoice(voice.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
