import { enhanceSystemPrompt } from "@/prompts/intelligence-layer";
import OpenAI from "openai";
import {
  getParaphraseInstruction,
  type ParaphraseModeId,
} from "@/lib/paraphrase-modes";

export interface ParaphraseResult {
  result: string;
  summary: string;
  mode: string;
}

export async function runParaphrase(
  text: string,
  mode: ParaphraseModeId
): Promise<ParaphraseResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const instruction = getParaphraseInstruction(mode);

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: enhanceSystemPrompt(`You are an expert paraphrasing assistant. ${instruction}

Return ONLY valid JSON:
{
  "result": string (full paraphrased text only — no quotes or labels),
  "summary": string (one sentence on what changed)
}`),
      },
      { role: "user", content: text },
    ],
    temperature: 0.55,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Paraphrase failed");

  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) as {
    result?: string;
    summary?: string;
  };

  if (!parsed.result?.trim()) throw new Error("Empty paraphrase result");

  return {
    result: parsed.result.trim(),
    summary: parsed.summary?.trim() || "Text paraphrased successfully.",
    mode,
  };
}
