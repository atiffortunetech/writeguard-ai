import { enhanceSystemPrompt } from "@/prompts/intelligence-layer";
import OpenAI from "openai";
import type { PlagiarismResult } from "@/types/ai";
import {
  PLAGIARISM_DISCLAIMER,
  PLAGIARISM_SYSTEM,
  buildPlagiarismPrompt,
} from "@/prompts/plagiarism";
import type { PlagiarismProvider } from "@/providers/plagiarism/index";

interface RawPlagiarismResponse {
  similarityScore?: number;
  summary?: string;
  matchedSources?: Array<{
    title?: string;
    url?: string;
    matchPercentage?: number;
    matchedText?: string;
  }>;
  highlights?: Array<{ text?: string }>;
}

function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function buildHighlights(
  text: string,
  raw: RawPlagiarismResponse["highlights"]
): PlagiarismResult["highlights"] {
  if (!raw?.length) return [];

  return raw
    .filter((h) => h.text?.trim())
    .slice(0, 8)
    .map((h) => {
      const snippet = h.text!.trim();
      const idx = text.indexOf(snippet);
      const startIndex = idx >= 0 ? idx : 0;
      const endIndex = idx >= 0 ? idx + snippet.length : snippet.length;
      return { startIndex, endIndex, text: snippet };
    });
}

export class OpenAIPlagiarismProvider implements PlagiarismProvider {
  name = "openai";
  private client: OpenAI;
  private model: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
    this.model =
      process.env.OPENAI_PLAGIARISM_MODEL ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini";
  }

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async checkPlagiarism(text: string): Promise<PlagiarismResult> {
    const input = text.trim().slice(0, 12000);
    if (input.length < 20) {
      throw new Error("Text is too short to analyze meaningfully (minimum 20 characters).");
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: enhanceSystemPrompt(PLAGIARISM_SYSTEM) },
        { role: "user", content: buildPlagiarismPrompt(input) },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(
      content.replace(/```json\n?|\n?```/g, "").trim()
    ) as RawPlagiarismResponse;

    const matchedSources = (parsed.matchedSources ?? [])
      .filter((s) => s.title?.trim() || s.matchedText?.trim())
      .slice(0, 5)
      .map((s) => ({
        url: s.url?.trim() || "AI originality analysis",
        title: s.title?.trim(),
        matchPercentage: clampPercent(Number(s.matchPercentage) || 0),
        matchedText: s.matchedText?.trim(),
      }));

    return {
      similarityScore: clampPercent(Number(parsed.similarityScore) || 0),
      matchedSources,
      highlights: buildHighlights(input, parsed.highlights),
      provider: this.name,
      summary: parsed.summary?.trim(),
      disclaimer: PLAGIARISM_DISCLAIMER,
    };
  }
}
