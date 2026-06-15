"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormattedTextInput } from "@/components/tools/formatted-text-input";
import { useFormattedContent } from "@/hooks/use-formatted-content";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Copy,
  FileText,
  Loader2,
  Paperclip,
  ScrollText,
  Upload,
  X,
} from "lucide-react";
import {
  extractSopAttachmentText,
  formatBytes,
  SOP_ATTACHMENT_LIMITS,
  totalAttachmentChars,
  type SopReportAttachmentItem,
} from "@/lib/sop-report-attachments";
import {
  SOP_REPORT_DOCUMENT_TYPES,
  SOP_REPORT_LENGTHS,
  SOP_REPORT_TONES,
  type SopReportDocumentType,
  type SopReportLength,
  type SopReportTone,
} from "@/prompts/sop-reports";

type GeneratedDoc = {
  title: string;
  documentType: string;
  summary: string;
  sections: Array<{ heading: string; content: string }>;
  fullDocument: string;
};

const DOC_TYPE_ICONS: Record<SopReportDocumentType, typeof FileText> = {
  sop: ClipboardList,
  report: ScrollText,
  "summary-report": FileText,
  "process-guide": ClipboardList,
};

export default function SopReportsPage() {
  const { plainText: topicText, onFormattedChange: onTopicChange } = useFormattedContent();
  const [form, setForm] = useState({
    documentType: "sop" as SopReportDocumentType,
    title: "",
    audience: "",
    department: "",
    tone: "professional" as SopReportTone,
    length: "standard" as SopReportLength,
    additionalNotes: "",
  });
  const [attachments, setAttachments] = useState<SopReportAttachmentItem[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [addingAttachments, setAddingAttachments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDoc | null>(null);

  const attachmentCharCount = totalAttachmentChars(attachments);
  const hasEnoughInput =
    topicText.trim().length >= 10 || attachmentCharCount >= 50;

  const addAttachments = async (files: FileList | null) => {
    if (!files?.length) return;

    setAttachmentError(null);
    setAddingAttachments(true);

    try {
      const remainingSlots = SOP_ATTACHMENT_LIMITS.maxCount - attachments.length;
      if (remainingSlots <= 0) {
        setAttachmentError(`Maximum ${SOP_ATTACHMENT_LIMITS.maxCount} attachments allowed`);
        return;
      }

      const allSelected = Array.from(files);
      const selected = allSelected.slice(0, remainingSlots);
      const next: SopReportAttachmentItem[] = [];
      const errors: string[] = [];

      if (allSelected.length > remainingSlots) {
        errors.push(
          `Only ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"} allowed — ${allSelected.length - remainingSlots} skipped`
        );
      }

      for (const file of selected) {
        if (
          attachments.some((item) => item.name === file.name) ||
          next.some((item) => item.name === file.name)
        ) {
          errors.push(`${file.name} is already attached`);
          continue;
        }

        try {
          const content = await extractSopAttachmentText(file);
          const projectedTotal =
            attachmentCharCount +
            next.reduce((sum, item) => sum + item.content.length, 0) +
            content.length;

          if (projectedTotal > SOP_ATTACHMENT_LIMITS.maxTotalChars) {
            errors.push(`${file.name}: total attachment content limit reached`);
            continue;
          }

          next.push({
            id: crypto.randomUUID(),
            name: file.name,
            content,
            size: file.size,
          });
        } catch (err) {
          errors.push(err instanceof Error ? err.message : `Could not read ${file.name}`);
        }
      }

      if (next.length > 0) {
        setAttachments((prev) => [...prev, ...next]);
      }
      if (errors.length > 0) {
        setAttachmentError(errors.join(" · "));
      }
    } finally {
      setAddingAttachments(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    setAttachmentError(null);
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/tools/sop-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: form.documentType,
        title: form.title,
        topic: topicText,
        audience: form.audience || undefined,
        department: form.department || undefined,
        tone: form.tone,
        length: form.length,
        additionalNotes: form.additionalNotes || undefined,
        attachments:
          attachments.length > 0
            ? attachments.map(({ name, content }) => ({ name, content }))
            : undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Generation failed");
      return;
    }

    setResult(data);
  };

  const copyDocument = () => {
    if (result?.fullDocument) {
      navigator.clipboard.writeText(result.fullDocument);
    }
  };

  const selectedType = SOP_REPORT_DOCUMENT_TYPES[form.documentType];

  return (
    <>
      <DashboardHeader
        title="SOP & Reports"
        description="Generate SOPs, business reports, and process guides from your topic or explanation"
      />
      <div className="dashboard-content">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="font-display">Document type</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {(
                  Object.entries(SOP_REPORT_DOCUMENT_TYPES) as [
                    SopReportDocumentType,
                    (typeof SOP_REPORT_DOCUMENT_TYPES)[SopReportDocumentType],
                  ][]
                ).map(([key, meta]) => {
                  const Icon = DOC_TYPE_ICONS[key];
                  const active = form.documentType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, documentType: key })}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-violet-400 bg-violet-50/80 shadow-md"
                          : "border-violet-100 bg-white hover:border-violet-200"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-semibold text-slate-900">
                          {meta.label.split(" (")[0]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{meta.description}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Your inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Customer Onboarding SOP"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Topic / explanation
                    {attachmentCharCount < 50 ? " *" : " (optional with attachments)"}
                  </Label>
                  <FormattedTextInput onChange={onTopicChange} minHeight="200px" />
                  <p className="text-xs text-slate-500">
                    Describe what you need, or upload reference files below (or both).
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-violet-500" />
                      Reference attachments
                    </Label>
                    <span className="text-xs text-slate-500">
                      {attachments.length}/{SOP_ATTACHMENT_LIMITS.maxCount} files
                    </span>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-6 text-center hover:bg-violet-50">
                    {addingAttachments ? (
                      <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                    ) : (
                      <Upload className="h-6 w-6 text-violet-400" />
                    )}
                    <span className="text-sm font-medium text-violet-700">
                      {addingAttachments ? "Reading files…" : "Add reference files"}
                    </span>
                    <span className="text-xs text-slate-500">
                      .txt, .md, .csv, .json, .html, .docx · up to 2 MB each · max{" "}
                      {SOP_ATTACHMENT_LIMITS.maxCount} files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept={SOP_ATTACHMENT_LIMITS.accept}
                      className="hidden"
                      disabled={
                        addingAttachments ||
                        attachments.length >= SOP_ATTACHMENT_LIMITS.maxCount
                      }
                      onChange={(e) => {
                        void addAttachments(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {attachments.length > 0 && (
                    <ul className="space-y-2">
                      {attachments.map((file) => (
                        <li
                          key={file.id}
                          className="flex items-start gap-3 rounded-xl border border-violet-100 bg-white px-3 py-2.5"
                        >
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatBytes(file.size)} ·{" "}
                              {file.content.length.toLocaleString()} characters extracted
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-600"
                            onClick={() => removeAttachment(file.id)}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {attachmentCharCount > 0 && (
                    <p className="text-xs text-slate-500">
                      {attachmentCharCount.toLocaleString()} characters from attachments
                    </p>
                  )}

                  {attachmentError && (
                    <p className="text-xs text-red-600">{attachmentError}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Input
                      value={form.audience}
                      onChange={(e) => setForm({ ...form, audience: e.target.value })}
                      placeholder="e.g. Support team, executives"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      placeholder="e.g. Operations, HR"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <select
                      value={form.tone}
                      onChange={(e) =>
                        setForm({ ...form, tone: e.target.value as SopReportTone })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {Object.entries(SOP_REPORT_TONES).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Length</Label>
                    <select
                      value={form.length}
                      onChange={(e) =>
                        setForm({ ...form, length: e.target.value as SopReportLength })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {Object.entries(SOP_REPORT_LENGTHS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional notes (optional)</Label>
                  <Textarea
                    value={form.additionalNotes}
                    onChange={(e) =>
                      setForm({ ...form, additionalNotes: e.target.value })
                    }
                    rows={3}
                    placeholder="Compliance requirements, tools used, deadlines, etc."
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                  onClick={generate}
                  disabled={loading || !form.title.trim() || !hasEnoughInput}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generate {selectedType.label.split(" (")[0]}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-0">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="font-display">Generated document</CardTitle>
                {result && (
                  <p className="mt-1 text-sm text-slate-500">{result.summary}</p>
                )}
              </div>
              {result && (
                <Button size="sm" variant="outline" onClick={copyDocument}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!result ? (
                <p className="py-16 text-center text-sm text-slate-500">
                  Your SOP or report will appear here
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{result.title}</Badge>
                    <Badge variant="secondary">{result.documentType}</Badge>
                  </div>

                  {result.sections.length > 0 ? (
                    result.sections.map((section) => (
                      <div key={section.heading} className="space-y-2">
                        <h3 className="font-semibold text-slate-900">
                          {section.heading}
                        </h3>
                        <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                          {section.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-sans leading-relaxed">
                      {result.fullDocument}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
