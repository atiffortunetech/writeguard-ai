import { getAIProvider } from "@/providers/ai";
import { TOOL_PROMPTS, CHAT_SYSTEM, AGENT_PROMPTS, RESUME_SYSTEM } from "@/prompts/tools";
import { GRAMMAR_ANALYSIS_SYSTEM, buildGrammarAnalysisPrompt } from "@/prompts/writing";
import { enhanceSystemPrompt } from "@/prompts/intelligence-layer";
import OpenAI from "openai";

export interface ToolRunResult {
  result: string;
  summary?: string;
  items?: Array<{ label: string; detail: string; severity?: string }>;
  scores?: Record<string, number>;
  raw?: unknown;
}

function parseToolJSON(content: string): ToolRunResult {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as ToolRunResult;
  return parsed;
}

async function runToolChat(system: string, user: string): Promise<ToolRunResult> {
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
      { role: "user", content: user },
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return parseToolJSON(content);
}

export async function runWritingTool(
  toolSlug: string,
  text: string,
  options?: Record<string, string>
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
    const provider = getAIProvider();
    const rewritten = await provider.rewrite(text, "improve_clarity");
    return {
      result: rewritten.rewrittenText,
      summary: rewritten.explanation ?? "Text paraphrased successfully.",
      scores: rewritten.scores as Record<string, number> | undefined,
    };
  }

  const prompt = TOOL_PROMPTS[toolSlug];
  if (!prompt) {
    throw new Error(`Unknown tool: ${toolSlug}`);
  }

  return runToolChat(prompt.system, `${prompt.userPrefix}\n\n"""${text}"""`);
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
