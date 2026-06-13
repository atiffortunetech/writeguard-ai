import type { PlagiarismResult } from "@/types/ai";
import { OpenAIPlagiarismProvider } from "./openai-provider";
import { PLAGIARISM_DISCLAIMER } from "@/prompts/plagiarism";

export interface PlagiarismProvider {
  name: string;
  isConfigured(): boolean;
  checkPlagiarism(text: string): Promise<PlagiarismResult>;
}

class UnconfiguredPlagiarismProvider implements PlagiarismProvider {
  name = "none";

  isConfigured() {
    return false;
  }

  async checkPlagiarism(): Promise<PlagiarismResult> {
    throw new Error("Plagiarism provider not configured");
  }
}

let provider: PlagiarismProvider | null = null;

export function getPlagiarismProvider(): PlagiarismProvider {
  if (!provider) {
    if (process.env.OPENAI_API_KEY) {
      provider = new OpenAIPlagiarismProvider();
    } else {
      provider = new UnconfiguredPlagiarismProvider();
    }
  }
  return provider;
}

export { PLAGIARISM_DISCLAIMER };
