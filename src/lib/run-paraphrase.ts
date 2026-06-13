import {
  getParaphraseInstruction,
  type ParaphraseModeId,
} from "@/lib/paraphrase-modes";
import { runFormattedAI } from "@/lib/run-formatted-ai";

export interface ParaphraseResult {
  result: string;
  resultHtml?: string;
  summary: string;
  mode: string;
  format: "html" | "plain";
}

export async function runParaphrase(
  text: string,
  mode: ParaphraseModeId,
  html?: string
): Promise<ParaphraseResult> {
  const instruction = getParaphraseInstruction(mode);

  const out = await runFormattedAI({
    systemPrompt: `You are an expert paraphrasing assistant. ${instruction}`,
    text,
    html,
    temperature: 0.55,
  });

  return {
    result: out.result,
    resultHtml: out.resultHtml,
    summary: out.summary ?? "Text paraphrased successfully.",
    mode,
    format: out.format,
  };
}
