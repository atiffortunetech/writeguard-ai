import { getAIProvider } from "@/providers/ai";
import { TOOL_PROMPTS, CHAT_SYSTEM, AGENT_PROMPTS, RESUME_SYSTEM } from "@/prompts/tools";
import { GRAMMAR_ANALYSIS_SYSTEM, buildGrammarAnalysisPrompt } from "@/prompts/writing";
import { enhanceSystemPrompt } from "@/prompts/intelligence-layer";
import { runFormattedAI } from "@/lib/run-formatted-ai";
import { hasRichFormatting } from "@/lib/formatted-text";
import { runParaphrase } from "@/lib/run-paraphrase";
import OpenAI from "openai";

export interface ToolRunResult {
  result: string;
  resultHtml?: string;
  summary?: string;
  items?: Array<{ label: string; detail: string; severity?: string }>;
  scores?: Record<string, number>;
  raw?: unknown;
  format?: "html" | "plain";
}

async function runToolChat(
  system: string,
  userPrefix: string,
  text: string,
  html?: string
): Promise<ToolRunResult> {
  if (html && hasRichFormatting(html)) {
    const out = await runFormattedAI({
      systemPrompt: system,
      text,
      html,
      temperature: 0.4,
    });
    return {
      result: out.result,
      resultHtml: out.resultHtml,
      summary: out.summary,
      format: out.format,
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: enhanceSystemPrompt(system) },
      { role: "user", content: `${userPrefix}\n\n"""${text}"""` },
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as ToolRunResult;
}

export async function runWritingTool(
  toolSlug: string,
  text: string,
  options?: { html?: string }
): Promise<ToolRunResult> {
  if (toolSlug === "grammar-checker") {
    const provider = getAIProvider();
    const analysis = await provider.analyzeGrammar(text);
    return {
      result: text,
      summary: `Overall score: ${analysis.overallScore}/100. Found ${analysis.suggestions.length} suggestions.`,
      items: analysis.suggestions.map((s) => ({
        label: s.type,
        detail: `${s.originalText} → ${s.suggestedText}: ${s.explanation}`,
        severity: s.severity,
      })),
      scores: {
        overall: analysis.overallScore,
        grammar: analysis.grammarScore,
        clarity: analysis.clarityScore,
        tone: analysis.toneScore,
        readability: analysis.readabilityScore,
      },
      raw: analysis,
    };
  }

  if (toolSlug === "paraphrase") {
    const paraphrased = await runParaphrase(text, "standard", options?.html);
    return {
      result: paraphrased.result,
      resultHtml: paraphrased.resultHtml,
      summary: paraphrased.summary,
      format: paraphrased.format,
    };
  }

  const prompt = TOOL_PROMPTS[toolSlug];
  if (!prompt) {
    throw new Error(`Unknown tool: ${toolSlug}`);
  }

  return runToolChat(
    prompt.system,
    prompt.userPrefix,
    text,
    options?.html
  );
}

export async function runChatMessage(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  agentId?: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const system = agentId && AGENT_PROMPTS[agentId] ? AGENT_PROMPTS[agentId] : CHAT_SYSTEM;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "system", content: enhanceSystemPrompt(system) }, ...messages],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function runResumeBuilder(input: Record<string, string>): Promise<{
  summary: string;
  experience: string[];
  skills: string[];
  education: string;
  fullResume: string;
}> {
  const user = Object.entries(input)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: enhanceSystemPrompt(RESUME_SYSTEM) },
      { role: "user", content: user },
    ],
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");

  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) as {
    summary?: string;
    experience?: string[];
    skills?: string[];
    education?: string;
    fullResume?: string;
  };

  return {
    summary: parsed.summary ?? "",
    experience: parsed.experience ?? [],
    skills: parsed.skills ?? [],
    education: parsed.education ?? "",
    fullResume: parsed.fullResume ?? "",
  };
}
