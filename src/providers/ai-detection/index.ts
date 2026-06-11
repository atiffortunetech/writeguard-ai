import type { AIDetectionResult } from "@/types/ai";
import { OpenAIDetectionProvider } from "./openai-provider";
import { AI_DETECTION_DISCLAIMER } from "@/prompts/ai-detection";

export interface AIDetectionProvider {
  name: string;
  isConfigured(): boolean;
  detectAI(text: string): Promise<AIDetectionResult>;
}

class UnconfiguredAIDetectionProvider implements AIDetectionProvider {
  name = "none";

  isConfigured() {
    return false;
  }

  async detectAI(): Promise<AIDetectionResult> {
    throw new Error("AI detection provider not configured");
  }
}

let provider: AIDetectionProvider | null = null;

export function getAIDetectionProvider(): AIDetectionProvider {
  if (!provider) {
    if (process.env.OPENAI_API_KEY) {
      provider = new OpenAIDetectionProvider();
    } else {
      provider = new UnconfiguredAIDetectionProvider();
    }
  }
  return provider;
}

export { AI_DETECTION_DISCLAIMER };
