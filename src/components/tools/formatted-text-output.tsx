"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { isHtmlResult, sanitizeHtml } from "@/lib/formatted-text";

interface FormattedTextOutputProps {
  result?: string | null;
  resultHtml?: string | null;
  emptyMessage?: string;
  className?: string;
}

export function FormattedTextOutput({
  result,
  resultHtml,
  emptyMessage = "Results appear here",
  className,
}: FormattedTextOutputProps) {
  const [copied, setCopied] = useState(false);

  const html =
    resultHtml?.trim() ||
    (result && isHtmlResult(result) ? sanitizeHtml(result) : null);
  const plain = result?.trim() ?? "";

  const copy = async () => {
    if (!html && !plain) return;
    try {
      if (html && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([htmlToPlainForCopy(html)], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(plain || htmlToPlainForCopy(html ?? ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!html && !plain) {
    return (
      <p className={cn("py-16 text-center text-sm text-slate-500", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={copy} aria-label="Copy with formatting">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      {html ? (
        <div
          className="formatted-tool-prose prose prose-slate max-w-none rounded-xl bg-emerald-50/80 p-4 text-sm leading-relaxed text-slate-800"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="whitespace-pre-wrap rounded-xl bg-emerald-50/80 p-4 text-sm leading-relaxed text-slate-800">
          {plain}
        </div>
      )}
    </div>
  );
}

function htmlToPlainForCopy(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}
