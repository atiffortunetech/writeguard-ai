import OpenAI from "openai";
import { computeWritingMetrics, type WritingMetrics } from "@/lib/writing-metrics";

export interface WritingIntelligenceResult {
  metrics: WritingMetrics;
  overallScore: number;
  grammarScore: number;
  clarityScore: number;
  engagementScore: number;
  tone: string;
  audienceFit: string;
  aiLikelihood: number;
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
}

const INTELLIGENCE_SYSTEM = `You are an expert writing analyst (Grammarly-level+). Analyze text holistically.

Return ONLY valid JSON:
{
  "overallScore": number 0-100,
  "grammarScore": number 0-100,
  "clarityScore": number 0-100,
  "engagementScore": number 0-100,
  "tone": string (primary tone in 2-4 words),
  "audienceFit": string (who this writing suits best),
  "aiLikelihood": number 0-100 (estimated probability text is AI-generated),
  "topStrengths": string[] (2-4 bullets),
  "topImprovements": string[] (2-4 actionable bullets),
  "summary": string (2 sentences max)
}`;

export async function runWritingIntelligence(
  text: string,
  audience?: string
): Promise<WritingIntelligenceResult> {
  const metrics = computeWritingMetrics(text);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const audienceNote = audience?.trim()
    ? `\nTarget audience for this analysis: ${audience}`
    : "";

  const response = await client.chat.completions.create({
    model:
      process.env.OPENAI_INTELLIGENCE_MODEL ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini",
    messages: [
      { role: "system", content: INTELLIGENCE_SYSTEM },
      {
        role: "user",
        content: `Analyze this writing. Local metrics: ${metrics.words} words, Flesch ${metrics.fleschReadingEase}, grade ${metrics.fleschKincaidGrade}.${audienceNote}\n\n"""\n${text.slice(0, 12000)}\n"""`,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Intelligence analysis failed");

  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) as Omit<
    WritingIntelligenceResult,
    "metrics"
  >;

  return {
    metrics,
    overallScore: clamp(parsed.overallScore, 0, 100),
    grammarScore: clamp(parsed.grammarScore, 0, 100),
    clarityScore: clamp(parsed.clarityScore, 0, 100),
    engagementScore: clamp(parsed.engagementScore, 0, 100),
    tone: parsed.tone?.trim() || "Neutral",
    audienceFit: parsed.audienceFit?.trim() || "General audience",
    aiLikelihood: clamp(parsed.aiLikelihood, 0, 100),
    topStrengths: Array.isArray(parsed.topStrengths) ? parsed.topStrengths.slice(0, 4) : [],
    topImprovements: Array.isArray(parsed.topImprovements) ? parsed.topImprovements.slice(0, 4) : [],
    summary: parsed.summary?.trim() || "Analysis complete.",
  };
}

function clamp(n: number, min: number, max: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return min;
  return Math.round(Math.max(min, Math.min(max, n)));
}
