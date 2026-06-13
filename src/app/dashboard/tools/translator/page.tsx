"use client";

import { useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { FormattedTextInput } from "@/components/tools/formatted-text-input";
import { FormattedTextOutput } from "@/components/tools/formatted-text-output";
import { useFormattedContent } from "@/hooks/use-formatted-content";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Copy,
  Check,
  Languages,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import {
  AUTO_DETECT_LANGUAGE,
  TRANSLATION_LANGUAGES,
  languageLabel,
  getLanguageByCode,
} from "@/lib/languages";

interface TranslateOutput {
  result: string;
  resultHtml?: string;
  summary?: string;
  detectedSourceLanguage?: string;
}

function LanguageSelect({
  id,
  value,
  onChange,
  allowAuto,
}: {
  id: string;
  value: string;
  onChange: (code: string) => void;
  allowAuto?: boolean;
}) {
  const popular = TRANSLATION_LANGUAGES.filter((l) => l.popular);
  const other = TRANSLATION_LANGUAGES.filter((l) => !l.popular);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm"
    >
      {allowAuto && (
        <option value={AUTO_DETECT_LANGUAGE.code}>{languageLabel(AUTO_DETECT_LANGUAGE)}</option>
      )}
      <optgroup label="Popular">
        {popular.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {languageLabel(lang)}
          </option>
        ))}
      </optgroup>
      <optgroup label="All languages">
        {other.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {languageLabel(lang)}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

export default function TranslatorPage() {
  const { plainText, onFormattedChange, requestBody, isEmpty, hasFormatting } = useFormattedContent();
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [formality, setFormality] = useState<"neutral" | "formal" | "casual">("neutral");
  const [domain, setDomain] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<TranslateOutput | null>(null);
  const [copied, setCopied] = useState(false);

  const charCount = plainText.length;
  const targetLang = getLanguageByCode(targetLanguage);

  const swapLanguages = () => {
    if (sourceLanguage === "auto") {
      if (output?.detectedSourceLanguage) {
        const match = TRANSLATION_LANGUAGES.find(
          (l) =>
            l.name.toLowerCase() === output.detectedSourceLanguage?.toLowerCase() ||
            l.nativeName === output.detectedSourceLanguage
        );
        if (match) setSourceLanguage(match.code);
      } else {
        setSourceLanguage(targetLanguage);
      }
    } else {
      const prevSource = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(prevSource);
    }
    if (output?.result) {
      setOutput(null);
    }
  };

  const setQuickPair = (from: string, to: string) => {
    setSourceLanguage(from);
    setTargetLanguage(to);
    setOutput(null);
    setError(null);
  };

  const translate = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/tools/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        requestBody({ sourceLanguage, targetLanguage, formality, domain })
      ),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Translation failed");
      return;
    }
    setOutput(data);
  };

  const copy = async () => {
    if (!output?.result && !output?.resultHtml) return;
    try {
      if (output.resultHtml && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([output.resultHtml], { type: "text/html" }),
            "text/plain": new Blob([output.result], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(output.result);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(output.result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sourceLabel = useMemo(() => {
    if (sourceLanguage === "auto") return "Auto-detect";
    return getLanguageByCode(sourceLanguage)?.name ?? sourceLanguage;
  }, [sourceLanguage]);

  return (
    <>
      <DashboardHeader
        title="Translator"
        description="Translate text between any languages — Urdu, English, Arabic, and 40+ more"
      />
      <div className="dashboard-content">
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="secondary">40+ languages</Badge>
          <Badge variant="outline">Domain: legal, medical, marketing</Badge>
          <Badge variant="outline">Auto-detect source</Badge>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setQuickPair("ur", "en")}
          >
            Urdu → English
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setQuickPair("en", "ur")}
          >
            English → Urdu
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setQuickPair("auto", "en")}
          >
            Auto → English
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setQuickPair("auto", "ur")}
          >
            Auto → Urdu
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-400" />
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Languages className="h-5 w-5 text-violet-500" />
                  Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="source-lang">From</Label>
                    <LanguageSelect
                      id="source-lang"
                      value={sourceLanguage}
                      onChange={setSourceLanguage}
                      allowAuto
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="mb-0.5 shrink-0"
                    onClick={swapLanguages}
                    title="Swap languages"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label htmlFor="target-lang">To</Label>
                    <LanguageSelect
                      id="target-lang"
                      value={targetLanguage}
                      onChange={setTargetLanguage}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="formality">Formality</Label>
                    <select
                      id="formality"
                      value={formality}
                      onChange={(e) =>
                        setFormality(e.target.value as "neutral" | "formal" | "casual")
                      }
                      className="w-full rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain / context</Label>
                    <select
                      id="domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm"
                    >
                      <option value="general">General</option>
                      <option value="business">Business</option>
                      <option value="legal">Legal</option>
                      <option value="medical">Medical</option>
                      <option value="marketing">Marketing</option>
                      <option value="technical">Technical</option>
                      <option value="academic">Academic</option>
                    </select>
                  </div>
                </div>

                <FormattedTextInput
                  onChange={onFormattedChange}
                  placeholder={`Type or paste text in ${sourceLabel}…`}
                  minHeight="280px"
                />
                {hasFormatting && (
                  <p className="text-xs text-violet-600">
                    Formatted content detected — headings & bold will be preserved in translation.
                  </p>
                )}
                <p className="text-xs text-slate-500">{charCount.toLocaleString()} characters</p>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                )}

                <Button
                  onClick={translate}
                  disabled={loading || isEmpty}
                  className="h-11 w-full border-0 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Translate to {targetLang?.name ?? "target language"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

          <Card className="glass-card border-0">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display">Translation</CardTitle>
                {output?.result ? (
                  <Button size="sm" variant="outline" onClick={copy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                {!output ? (
                  <p className="py-16 text-center text-sm text-slate-500">
                    Your translation will appear here
                  </p>
                ) : (
                  <div className="space-y-4">
                    {output.summary && (
                      <p className="text-sm text-slate-600">{output.summary}</p>
                    )}
                    {output.detectedSourceLanguage && sourceLanguage === "auto" && (
                      <Badge variant="secondary">
                        Detected: {output.detectedSourceLanguage}
                      </Badge>
                    )}
                    <FormattedTextOutput
                      result={output.result}
                      resultHtml={output.resultHtml}
                      className={
                        ["ur", "ar", "fa", "he"].includes(targetLanguage) ? "rtl" : undefined
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
