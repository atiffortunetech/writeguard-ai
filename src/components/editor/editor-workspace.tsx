"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentEditor } from "@/components/editor/document-editor";
import { ScorePanel } from "@/components/editor/score-panel";
import { SuggestionPanel } from "@/components/editor/suggestion-panel";
import { useEditorStore } from "@/stores/editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { REWRITE_ACTION_LABELS } from "@/types/index";
import { TONE_CATEGORIES } from "@/types/index";
import { Loader2, Sparkles, Wand2, CheckCheck } from "lucide-react";

interface EditorWorkspaceProps {
  documentId?: string;
  initialTitle?: string;
  initialContent?: string;
}

export function EditorWorkspace({
  documentId: initialDocumentId,
  initialTitle = "Untitled Document",
  initialContent = "",
}: EditorWorkspaceProps) {
  const router = useRouter();
  const {
    documentId,
    title,
    content,
    plainText,
    isSaving,
    isAnalyzing,
    isRewriting,
    analysis,
    selectedBrandVoiceId,
    setDocumentId,
    setTitle,
    setContent,
    setIsSaving,
    setIsAnalyzing,
    setIsRewriting,
    setAnalysis,
    setSelectedBrandVoiceId,
  } = useEditorStore();

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [brandVoices, setBrandVoices] = useState<Array<{ id: string; name: string }>>([]);
  const [styleGuides, setStyleGuides] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStyleGuideId, setSelectedStyleGuideId] = useState<string | null>(null);
  const [targetTone, setTargetTone] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDocumentId(initialDocumentId ?? null);
    setTitle(initialTitle);
    setContent(initialContent, initialContent.replace(/<[^>]*>/g, " "));
  }, [initialDocumentId, initialTitle, initialContent, setDocumentId, setTitle, setContent]);

  useEffect(() => {
    fetch("/api/brand-voice")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBrandVoices(data); })
      .catch(() => {});
    fetch("/api/style-guide")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setStyleGuides(data); })
      .catch(() => {});
  }, []);

  const saveDocument = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        content,
        plainText,
        brandVoiceId: selectedBrandVoiceId,
      };

      if (documentId) {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to save");
      } else {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create document");
        const doc = await res.json();
        setDocumentId(doc.id);
        router.replace(`/dashboard/editor/${doc.id}`);
      }
    } catch {
      setError("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  }, [documentId, title, content, plainText, selectedBrandVoiceId, setDocumentId, setIsSaving, router]);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (plainText.trim()) saveDocument();
    }, 3000);
  }, [plainText, saveDocument]);

  const handleEditorUpdate = useCallback(() => {
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const analyzeGrammar = async () => {
    if (!plainText.trim()) {
      setError("Add some text before running analysis");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: plainText,
          documentId,
          brandVoiceId: selectedBrandVoiceId,
          styleGuideId: selectedStyleGuideId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data);
      if (data.truncated) {
        setNotice(
          "Only the first 12,000 characters were analyzed. Shorten the document or split it for full coverage."
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      if (message === "Failed to fetch") {
        setError(
          "Could not reach the server. Run npm run dev in the writeguard-ai folder and keep that terminal open, then try again."
        );
      } else {
        setError(message);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const rewriteText = async (action: string) => {
    if (!plainText.trim()) {
      setError("Add some text before rewriting");
      return;
    }

    setIsRewriting(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: plainText,
          action,
          targetTone: action === "change_tone" ? targetTone : undefined,
          brandVoiceId: selectedBrandVoiceId,
          documentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rewrite failed");

      setContent(`<p>${data.rewrittenText.replace(/\n/g, "</p><p>")}</p>`, data.rewrittenText);
      scheduleAutoSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rewrite failed");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full min-w-0 border-0 text-base font-semibold shadow-none focus-visible:ring-0 sm:max-w-md sm:text-lg"
          placeholder="Document title"
        />
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {isSaving && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving
            </Badge>
          )}
          <select
            className="min-w-0 max-w-full rounded-lg border border-slate-200 px-2 py-2 text-xs sm:px-3 sm:text-sm"
            value={selectedBrandVoiceId ?? ""}
            onChange={(e) => setSelectedBrandVoiceId(e.target.value || null)}
          >
            <option value="">No brand voice</option>
            {brandVoices.map((bv) => (
              <option key={bv.id} value={bv.id}>{bv.name}</option>
            ))}
          </select>
          <select
            className="min-w-0 max-w-full rounded-lg border border-slate-200 px-2 py-2 text-xs sm:px-3 sm:text-sm"
            value={selectedStyleGuideId ?? ""}
            onChange={(e) => setSelectedStyleGuideId(e.target.value || null)}
          >
            <option value="">No style guide</option>
            {styleGuides.map((sg) => (
              <option key={sg.id} value={sg.id}>{sg.name}</option>
            ))}
          </select>
          <Button variant="outline" onClick={saveDocument} disabled={isSaving}>
            Save
          </Button>
          <Button onClick={analyzeGrammar} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="sr-only sm:not-sr-only sm:inline">Check Grammar</span>
          </Button>
        </div>
      </div>

      {notice && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800">
          {notice}
        </div>
      )}
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <DocumentEditor
            initialContent={initialContent}
            onUpdate={handleEditorUpdate}
          />

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                defaultValue=""
                onChange={(e) => { if (e.target.value) rewriteText(e.target.value); e.target.value = ""; }}
                disabled={isRewriting}
              >
                <option value="">AI Rewrite Actions...</option>
                {Object.entries(REWRITE_ACTION_LABELS).map(([action, label]) => (
                  <option key={action} value={action}>{label}</option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={targetTone}
                onChange={(e) => setTargetTone(e.target.value)}
              >
                <option value="">Target tone...</option>
                {TONE_CATEGORIES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {targetTone && (
                <Button size="sm" variant="outline" disabled={isRewriting} onClick={() => rewriteText("change_tone")}>
                  <Wand2 className="h-3 w-3" /> Apply Tone
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="max-h-[42vh] w-full shrink-0 overflow-y-auto border-t border-slate-200 bg-slate-50 p-4 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold text-slate-900">Writing Scores</h3>
              <ScorePanel analysis={analysis} />
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-slate-900">Suggestions</h3>
              <SuggestionPanel />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
