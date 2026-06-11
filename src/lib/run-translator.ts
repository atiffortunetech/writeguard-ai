import OpenAI from "openai";
import {
  TRANSLATOR_SYSTEM,
  buildTranslatorUserMessage,
} from "@/prompts/translator";
import { getLanguageByCode, languageLabel } from "@/lib/languages";

export interface TranslateResult {
  result: string;
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
  options?: { formality?: string; domain?: string }
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

  const response = await client.chat.completions.create({
    model: getTranslatorModel(),
    messages: [
      { role: "system", content: TRANSLATOR_SYSTEM },
      {
        role: "user",
        content: buildTranslatorUserMessage(
          text,
          sourceLang === "auto" ? "auto" : languageLabel(getLanguageByCode(sourceLanguageCode)!),
          languageLabel(targetLang),
          options
        ),
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty translation response");
  }

  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) as TranslateResult;
  if (!parsed.result?.trim()) {
    throw new Error("Translation failed — empty result");
  }

  return {
    result: parsed.result.trim(),
    summary:
      parsed.summary ??
      `Translated to ${targetLang.name}${parsed.detectedSourceLanguage ? ` from ${parsed.detectedSourceLanguage}` : ""}`,
    detectedSourceLanguage: parsed.detectedSourceLanguage,
  };
}
