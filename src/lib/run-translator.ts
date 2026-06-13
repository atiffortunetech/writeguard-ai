import {
  buildFormattedUserMessage,
  FORMAT_PRESERVATION_INSTRUCTIONS,
  hasRichFormatting,
  resolveFormattedAIResult,
} from "@/lib/formatted-text";
import { enhanceSystemPrompt } from "@/prompts/intelligence-layer";
import OpenAI from "openai";
import {
  TRANSLATOR_SYSTEM,
  buildTranslatorUserMessage,
} from "@/prompts/translator";
import { getLanguageByCode, languageLabel } from "@/lib/languages";

export interface TranslateResult {
  result: string;
  resultHtml?: string;
  summary?: string;
  detectedSourceLanguage?: string;
}

function getTranslatorModel(): string {
  return (
    process.env.OPENAI_TRANSLATOR_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4o-mini"
  );
}

export async function runTranslator(
  text: string,
  sourceLanguageCode: string,
  targetLanguageCode: string,
  options?: { formality?: string; domain?: string; html?: string }
): Promise<TranslateResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const targetLang = getLanguageByCode(targetLanguageCode);
  if (!targetLang) {
    throw new Error("Invalid target language");
  }

  const sourceLang =
    sourceLanguageCode === "auto"
      ? "auto"
      : getLanguageByCode(sourceLanguageCode)?.name ?? sourceLanguageCode;

  if (sourceLanguageCode !== "auto" && sourceLanguageCode === targetLanguageCode) {
    throw new Error("Source and target language must be different");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const useHtml = Boolean(options?.html && hasRichFormatting(options.html));
  const formatNote = useHtml ? `\n\n${FORMAT_PRESERVATION_INSTRUCTIONS}` : "";
  const jsonSchema = useHtml
    ? `Return ONLY valid JSON:
{
  "resultHtml": string (full translation as HTML with preserved h1-h6, p, strong, em, lists, links),
  "result": string (plain text translation in the target language),
  "summary": string (one short sentence),
  "detectedSourceLanguage": string (language name if source was auto-detected, else omit)
}`
    : `Return ONLY valid JSON:
{
  "result": string (the full translation in the target language — output ONLY the translated text, no quotes or labels),
  "detectedSourceLanguage": string (language name if source was auto-detected, else omit),
  "summary": string (one short sentence: e.g. "Translated from Urdu to English")
}`;

  const userContent = useHtml
    ? `${buildTranslatorUserMessage(
        text,
        sourceLang === "auto" ? "auto" : languageLabel(getLanguageByCode(sourceLanguageCode)!),
        languageLabel(targetLang),
        options
      ).replace(`"""\n${text}\n"""`, "")}\n\n${buildFormattedUserMessage(text, options?.html)}`
    : buildTranslatorUserMessage(
        text,
        sourceLang === "auto" ? "auto" : languageLabel(getLanguageByCode(sourceLanguageCode)!),
        languageLabel(targetLang),
        options
      );

  const response = await client.chat.completions.create({
    model: getTranslatorModel(),
    messages: [
      { role: "system", content: enhanceSystemPrompt(`${TRANSLATOR_SYSTEM}${formatNote}\n\n${jsonSchema}`) },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty translation response");
  }

  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) as {
    result?: string;
    resultHtml?: string;
    summary?: string;
    detectedSourceLanguage?: string;
  };

  const resolved = resolveFormattedAIResult(parsed, options?.html);
  if (!resolved.result && !resolved.resultHtml) {
    throw new Error("Translation failed — empty result");
  }

  return {
    result: resolved.result,
    resultHtml: resolved.resultHtml,
    summary:
      parsed.summary ??
      `Translated to ${targetLang.name}${parsed.detectedSourceLanguage ? ` from ${parsed.detectedSourceLanguage}` : ""}`,
    detectedSourceLanguage: parsed.detectedSourceLanguage,
  };
}
