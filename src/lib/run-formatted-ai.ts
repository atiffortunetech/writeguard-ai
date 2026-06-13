import { enhanceSystemPrompt } from "@/prompts/intelligence-layer";
import OpenAI from "openai";
import {
  buildFormattedUserMessage,
  FORMAT_PRESERVATION_INSTRUCTIONS,
  getFormattedJsonSchema,
  hasRichFormatting,
  resolveFormattedAIResult,
} from "@/lib/formatted-text";

export interface FormattedAIResult {
  result: string;
  resultHtml?: string;
  summary?: string;
  format: "html" | "plain";
}

export async function runFormattedAI(params: {
  systemPrompt: string;
  text: string;
  html?: string;
  temperature?: number;
}): Promise<FormattedAIResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const useHtml = Boolean(params.html && hasRichFormatting(params.html));
  const formatNote = useHtml ? `\n\n${FORMAT_PRESERVATION_INSTRUCTIONS}` : "";
  const jsonSchema = getFormattedJsonSchema(useHtml);

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: enhanceSystemPrompt(`${params.systemPrompt}${formatNote}\n\n${jsonSchema}`),
      },
      {
        role: "user",
        content: buildFormattedUserMessage(params.text, params.html),
      },
    ],
    temperature: params.temperature ?? 0.45,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");

  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) as {
    result?: string;
    resultHtml?: string;
    summary?: string;
  };

  const resolved = resolveFormattedAIResult(parsed, params.html);
  if (!resolved.result && !resolved.resultHtml) {
    throw new Error("Empty formatted result");
  }

  return resolved;
}
