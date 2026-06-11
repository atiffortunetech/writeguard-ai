import OpenAI from "openai";
import type { AIDetectionResult } from "@/types/ai";
import { AI_DETECTION_DISCLAIMER } from "@/prompts/ai-detection";
import {
  AI_DETECTION_SYSTEM,
  buildAIDetectionPrompt,
} from "@/prompts/ai-detection";
import type { AIDetectionProvider } from "@/providers/ai-detection/index";

interface RawDetectionResponse {
  aiProbability?: number;
  humanProbability?: number;
  mixedEstimate?: number;
  summary?: string;
  highlights?: Array<{
    text?: string;
    aiProbability?: number;
    reason?: string;
  }>;
}

function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeProbabilities(raw: RawDetectionResponse) {
  let ai = clampPercent(Number(raw.aiProbability) || 0);
  let human = clampPercent(Number(raw.humanProbability) || 0);

  if (ai === 0 && human === 0) {
    ai = 50;
    human = 50;
  } else if (human === 0 && ai > 0) {
    human = clampPercent(100 - ai);
  } else if (ai === 0 && human > 0) {
    ai = clampPercent(100 - human);
  }

  const mixed = clampPercent(
    Number(raw.mixedEstimate) || Math.round((ai + human) / 2)
  );

  return { ai, human, mixed };
}

function buildHighlights(
  text: string,
  raw: RawDetectionResponse["highlights"]
): AIDetectionResult["highlights"] {
  if (!raw?.length) return [];

  return raw
    .filter((h) => h.text?.trim())
    .slice(0, 5)
    .map((h) => {
      const snippet = h.text!.trim();
      const idx = text.indexOf(snippet);
      const startIndex = idx >= 0 ? idx : 0;
      const endIndex = idx >= 0 ? idx + snippet.length : snippet.length;

      return {
        startIndex,
        endIndex,
        text: snippet,
        aiProbability: clampPercent(Number(h.aiProbability) || 50),
      };
    });
}

export class OpenAIDetectionProvider implements AIDetectionProvider {
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
      process.env.OPENAI_DETECTION_MODEL ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini";
  }

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async detectAI(text: string): Promise<AIDetectionResult> {
    const input = text.trim().slice(0, 12000);
    if (input.length < 20) {
      throw new Error("Text is too short to analyze meaningfully (minimum 20 characters).");
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: AI_DETECTION_SYSTEM },
        { role: "user", content: buildAIDetectionPrompt(input) },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as RawDetectionResponse;
    const { ai, human, mixed } = normalizeProbabilities(parsed);

    return {
      aiProbability: ai,
      humanProbability: human,
      mixedEstimate: mixed,
      summary: parsed.summary?.trim(),
      highlights: buildHighlights(input, parsed.highlights),
      provider: this.name,
      disclaimer: AI_DETECTION_DISCLAIMER,
    };
  }
}
