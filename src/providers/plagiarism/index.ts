import type { PlagiarismResult } from "@/types/ai";

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

class CopyleaksProvider implements PlagiarismProvider {
  name = "copyleaks";

  isConfigured() {
    return Boolean(process.env.COPYLEAKS_API_KEY);
  }

  async checkPlagiarism(_text: string): Promise<PlagiarismResult> {
    throw new Error(
      "Copyleaks integration pending. Configure COPYLEAKS_API_KEY and implement API calls."
    );
  }
}

let provider: PlagiarismProvider | null = null;

export function getPlagiarismProvider(): PlagiarismProvider {
  if (!provider) {
    if (process.env.COPYLEAKS_API_KEY) {
      provider = new CopyleaksProvider();
    } else {
      provider = new UnconfiguredPlagiarismProvider();
    }
  }
  return provider;
}
