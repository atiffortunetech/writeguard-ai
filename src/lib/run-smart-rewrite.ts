import {
  getSmartRewriteInstruction,
  type SmartRewriteModeId,
} from "@/lib/smart-rewrite-modes";
import { runFormattedAI } from "@/lib/run-formatted-ai";

export interface SmartRewriteResult {
  result: string;
  resultHtml?: string;
  summary: string;
  mode: string;
  format: "html" | "plain";
}

export async function runSmartRewrite(
  text: string,
  mode: SmartRewriteModeId,
  html?: string
): Promise<SmartRewriteResult> {
  const instruction = getSmartRewriteInstruction(mode);

  const out = await runFormattedAI({
    systemPrompt: `You are an elite writing editor. ${instruction}`,
    text,
    html,
    temperature: 0.5,
  });

  return {
    result: out.resultHtml ?? out.result,
    resultHtml: out.resultHtml,
    summary: out.summary ?? `Rewritten in ${mode} mode`,
    mode,
    format: out.format,
  };
}
