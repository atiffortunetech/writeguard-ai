import OpenAI from "openai";
import {
  getSmartRewriteInstruction,
  type SmartRewriteModeId,
} from "@/lib/smart-rewrite-modes";

export interface SmartRewriteResult {
  result: string;
  summary: string;
  mode: string;
}

export async function runSmartRewrite(
  text: string,
  mode: SmartRewriteModeId
): Promise<SmartRewriteResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const instruction = getSmartRewriteInstruction(mode);

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an elite writing editor. ${instruction}

Return ONLY valid JSON:
{
  "result": string (full rewritten text only),
  "summary": string (one sentence on what changed)
}`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Rewrite failed");

  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) as {
    result?: string;
    summary?: string;
  };

  if (!parsed.result?.trim()) throw new Error("Empty rewrite result");

  return {
    result: parsed.result.trim(),
    summary: parsed.summary?.trim() || `Rewritten in ${mode} mode`,
    mode,
  };
}
