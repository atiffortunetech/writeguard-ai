"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { AnimateIn } from "@/components/ui/animate-in";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ImageIcon,
  RefreshCw,
  Download,
  Palette,
  Sparkles,
  AlertTriangle,
  Upload,
  X,
} from "lucide-react";

type ReferenceImagePayload = {
  base64: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  previewUrl: string;
};

const MAX_REFERENCE_BYTES = 4 * 1024 * 1024;

async function fileToReferencePayload(file: File): Promise<ReferenceImagePayload> {
  if (file.size > MAX_REFERENCE_BYTES) {
    throw new Error("Reference image must be 4 MB or smaller");
  }
  const mimeType = file.type;
  if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) {
    throw new Error("Use PNG, JPEG, or WebP for the reference image");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read reference image"));
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
  return {
    base64,
    mimeType: mimeType as ReferenceImagePayload["mimeType"],
    previewUrl: URL.createObjectURL(file),
  };
}

async function urlToReferencePayload(url: string): Promise<ReferenceImagePayload | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size > MAX_REFERENCE_BYTES) return null;
    const mimeType = blob.type;
    if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) return null;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read reference image"));
      reader.readAsDataURL(blob);
    });
    return {
      base64: dataUrl.replace(/^data:[^;]+;base64,/, ""),
      mimeType: mimeType as ReferenceImagePayload["mimeType"],
      previewUrl: url,
    };
  } catch {
    return null;
  }
}

type SourceTab = "prompt" | "text" | "document";

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface GeneratedImage {
  id: string;
  title: string | null;
  imageUrl: string;
  referenceImageUrl?: string | null;
  imagePrompt: string;
  summary?: string;
  colors: BrandColors;
  stylePreset: string;
  aspectRatio: string;
  createdAt: string;
}

interface StudioData {
  configured: boolean;
  images: GeneratedImage[];
  brandVoices: { id: string; name: string; tone: string | null }[];
  documents: { id: string; title: string }[];
  creditCost: number;
  imagesRemaining?: number;
}

const DEFAULT_COLORS: BrandColors = {
  primary: "#7C3AED",
  secondary: "#06B6D4",
  accent: "#F97316",
  background: "#FAF9FF",
};

const COLOR_PRESETS: { name: string; colors: BrandColors }[] = [
  { name: "WriteGuard", colors: DEFAULT_COLORS },
  {
    name: "Ocean",
    colors: { primary: "#0EA5E9", secondary: "#6366F1", accent: "#14B8A6", background: "#F0F9FF" },
  },
  {
    name: "Forest",
    colors: { primary: "#059669", secondary: "#84CC16", accent: "#F59E0B", background: "#F0FDF4" },
  },
  {
    name: "Bold Dark",
    colors: { primary: "#1E1B4B", secondary: "#7C3AED", accent: "#EC4899", background: "#0F172A" },
  },
];

const STYLE_OPTIONS = [
  { value: "social-banner", label: "Social banner" },
  { value: "hero", label: "Website hero" },
  { value: "product", label: "Product / e-commerce" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold marketing" },
  { value: "corporate", label: "Corporate" },
];

const ASPECT_OPTIONS = ["1:1", "16:9", "9:16", "4:3"] as const;

export default function BrandImagesPage() {
  const [tab, setTab] = useState<SourceTab>("prompt");
  const [sourceText, setSourceText] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [brandVoiceId, setBrandVoiceId] = useState("");
  const [colors, setColors] = useState<BrandColors>(DEFAULT_COLORS);
  const [stylePreset, setStylePreset] = useState("social-banner");
  const [aspectRatio, setAspectRatio] = useState<(typeof ASPECT_OPTIONS)[number]>("16:9");
  const [imagePrompt, setImagePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studio, setStudio] = useState<StudioData | null>(null);
  const [current, setCurrent] = useState<GeneratedImage | null>(null);
  const [referenceImage, setReferenceImage] = useState<ReferenceImagePayload | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  const loadStudio = () => {
    fetch("/api/brand-images")
      .then(async (r) => {
        const text = await r.text();
        if (!text) {
          setError("Empty response from server. Restart the dev server and try again.");
          return;
        }
        let data: StudioData;
        try {
          data = JSON.parse(text) as StudioData & { error?: string };
        } catch {
          setError("Invalid server response. Try restarting the dev server.");
          return;
        }
        if (!r.ok) {
          setError((data as { error?: string }).error || "Failed to load studio");
          return;
        }
        setStudio(data);
      })
      .catch(() => setError("Could not reach Brand Image API"));
  };

  useEffect(() => {
    loadStudio();
  }, []);

  const generate = async (regenerateOnly = false) => {
    setLoading(true);
    setError(null);

    let payloadSourceText = sourceText.trim();
    if (tab === "document" && documentId && !payloadSourceText) {
      payloadSourceText = `Document ID: ${documentId}`;
    }

    const res = await fetch("/api/brand-images/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType: tab,
        sourceText: regenerateOnly && imagePrompt ? imagePrompt : payloadSourceText,
        colors,
        stylePreset,
        aspectRatio,
        brandVoiceId: brandVoiceId || null,
        documentId: tab === "document" ? documentId || null : null,
        promptOverride: regenerateOnly ? imagePrompt : null,
        referenceImage: referenceImage
          ? { base64: referenceImage.base64, mimeType: referenceImage.mimeType }
          : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Generation failed");
      return;
    }

    setCurrent(data);
    setImagePrompt(data.imagePrompt);
    if (data.referenceImageUrl && referenceImage) {
      setReferenceImage((prev) =>
        prev
          ? { ...prev, previewUrl: data.referenceImageUrl ?? prev.previewUrl }
          : prev
      );
    }
    loadStudio();
  };

  const loadHistoryItem = async (item: GeneratedImage) => {
    setCurrent(item);
    setImagePrompt(item.imagePrompt);
    setColors(item.colors);
    setStylePreset(item.stylePreset);
    setAspectRatio(item.aspectRatio as (typeof ASPECT_OPTIONS)[number]);
    if (item.referenceImageUrl) {
      const ref = await urlToReferencePayload(item.referenceImageUrl);
      setReferenceImage(ref);
    } else {
      setReferenceImage(null);
    }
  };

  const handleReferenceUpload = async (file: File | null) => {
    setReferenceError(null);
    if (!file) return;
    try {
      if (referenceImage?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(referenceImage.previewUrl);
      }
      const payload = await fileToReferencePayload(file);
      setReferenceImage(payload);
    } catch (err) {
      setReferenceError(err instanceof Error ? err.message : "Invalid reference image");
    }
  };

  const clearReferenceImage = () => {
    if (referenceImage?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(referenceImage.previewUrl);
    }
    setReferenceImage(null);
    setReferenceError(null);
  };

  const updateColor = (key: keyof BrandColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const hasInput =
    tab === "document" ? Boolean(documentId) : sourceText.trim().length >= 3;

  const canGenerate = hasInput;
  const openaiReady = studio?.configured !== false;

  const generateHint = !hasInput
    ? "Enter at least 3 characters in your prompt first."
    : studio === null
      ? "Loading studio… or restart dev server if this persists."
      : !studio.configured
        ? "Add OPENAI_API_KEY to .env and restart the dev server."
        : null;

  return (
    <>
      <DashboardHeader
        title="Brand Image Studio"
        description="Generate on-brand marketing images with OpenAI — edit prompt & colors, then regenerate"
      />
      <div className="flex-1 overflow-y-auto p-8">
        {error && !loading && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {studio && !studio.configured && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Add <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> to your{" "}
              <code className="rounded bg-amber-100 px-1">.env</code> file and restart the dev server.
            </p>
          </div>
        )}

        {studio && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Badge variant="secondary">{studio.creditCost} AI credits per image</Badge>
            {studio.imagesRemaining != null && (
              <Badge variant="outline">{studio.imagesRemaining} images left this month</Badge>
            )}
            {referenceImage && (
              <Badge variant="outline" className="border-amber-200 text-amber-800">
                Reference image attached
              </Badge>
            )}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Input column */}
          <div className="space-y-6 xl:col-span-1">
            <AnimateIn direction="right">
              <Card className="glass-card border-0">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-400" />
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    Content source
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex rounded-xl bg-violet-50/80 p-1">
                    {(["prompt", "text", "document"] as SourceTab[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                          tab === t
                            ? "bg-white text-violet-700 shadow-sm"
                            : "text-slate-600 hover:text-violet-600"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {tab === "document" ? (
                    <div className="space-y-2">
                      <Label>From your document</Label>
                      <select
                        className="w-full rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm"
                        value={documentId}
                        onChange={(e) => setDocumentId(e.target.value)}
                      >
                        <option value="">Select a document…</option>
                        {studio?.documents.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <Textarea
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      rows={6}
                      placeholder={
                        tab === "prompt"
                          ? "Describe the image you want, e.g. SaaS hero banner about AI writing tools…"
                          : "Paste a sentence or paragraph — we'll turn it into a visual concept…"
                      }
                    />
                  )}

                  <div className="space-y-2">
                    <Label>Brand voice (optional)</Label>
                    <select
                      className="w-full rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm"
                      value={brandVoiceId}
                      onChange={(e) => setBrandVoiceId(e.target.value)}
                    >
                      <option value="">None</option>
                      {studio?.brandVoices.map((bv) => (
                        <option key={bv.id} value={bv.id}>
                          {bv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </AnimateIn>

            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-fuchsia-500 to-violet-500" />
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-violet-500" />
                  Brand colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setColors(p.colors)}
                      className="rounded-full border border-violet-100 px-3 py-1 text-xs font-medium hover:bg-violet-50"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                {(Object.keys(colors) as (keyof BrandColors)[]).map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-violet-100"
                    />
                    <div className="flex-1">
                      <Label className="capitalize">{key}</Label>
                      <Input
                        value={colors[key]}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
                <div
                  className="h-12 rounded-xl border border-violet-100"
                  style={{
                    background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
                  }}
                />
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-base">
                  <Upload className="h-4 w-4 text-violet-500" />
                  Reference image (optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-500">
                  Upload a photo or design to guide style, layout, and mood. OpenAI will
                  create a new on-brand image inspired by your reference.
                </p>
                {referenceImage ? (
                  <div className="relative overflow-hidden rounded-xl border border-violet-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={referenceImage.previewUrl}
                      alt="Reference preview"
                      className="max-h-40 w-full object-contain bg-slate-50"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={clearReferenceImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-8 text-center transition-colors hover:bg-violet-50">
                    <Upload className="h-8 w-8 text-violet-400" />
                    <span className="text-sm font-medium text-violet-700">
                      Click to upload reference
                    </span>
                    <span className="text-xs text-slate-500">PNG, JPEG, or WebP · max 4 MB</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        void handleReferenceUpload(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
                {referenceError && (
                  <p className="text-xs text-red-600">{referenceError}</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="font-display text-base">Style & size</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStylePreset(s.value)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium ${
                        stylePreset === s.value
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-violet-100 text-slate-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ASPECT_OPTIONS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAspectRatio(a)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                        aspectRatio === a
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-violet-100 text-slate-600"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview column */}
          <div className="space-y-6 xl:col-span-2">
            <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-violet-500" />
                  Preview
                </CardTitle>
                {current?.imageUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={current.imageUrl} download target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-violet-100 bg-slate-50">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                      <p className="text-sm">OpenAI is creating your image…</p>
                    </div>
                  ) : current?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={current.imageUrl}
                      alt={current.title ?? "Generated brand image"}
                      className="max-h-[420px] w-full object-contain"
                    />
                  ) : (
                    <p className="text-sm text-slate-500">
                      Your generated image will appear here
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>AI image prompt (editable — change & regenerate)</Label>
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={5}
                    placeholder="After first generation, edit this prompt and click Regenerate…"
                    className="text-sm"
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => generate(false)}
                    disabled={loading || !canGenerate}
                    className="btn-glow border-0 text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generate(true)}
                    disabled={loading || !imagePrompt.trim()}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate from prompt
                  </Button>
                </div>
                {generateHint && (
                  <p className="text-xs text-slate-500">{generateHint}</p>
                )}
                {!openaiReady && studio && (
                  <p className="text-xs text-amber-700">
                    OpenAI API key missing — generation will fail until OPENAI_API_KEY is set.
                  </p>
                )}
              </CardContent>
            </Card>

            {studio && studio.images.length > 0 && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="font-display text-base">Recent images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {studio.images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => loadHistoryItem(img)}
                        className="group overflow-hidden rounded-xl border border-violet-100 text-left transition-shadow hover:shadow-md"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.imageUrl}
                          alt={img.title ?? "Brand image"}
                          className="aspect-video w-full object-cover"
                        />
                        <p className="truncate px-2 py-1.5 text-xs text-slate-600 group-hover:text-violet-700">
                          {img.title ?? "Untitled"}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
