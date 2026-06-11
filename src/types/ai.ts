export type SuggestionType =
  | "grammar"
  | "spelling"
  | "clarity"
  | "tone"
  | "conciseness"
  | "rewrite"
  | "brand_voice"
  | "readability"
  | "punctuation";

export type SuggestionSeverity = "low" | "medium" | "high";

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  originalText: string;
  suggestedText: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
}

export interface WritingScores {
  overallScore: number;
  grammarScore: number;
  clarityScore: number;
  toneScore: number;
  readabilityScore: number;
  engagementScore: number;
  brandScore: number;
  seoScore: number;
  conversionScore: number;
}

export interface AnalysisResult extends WritingScores {
  suggestions: AISuggestion[];
  detectedTones?: string[];
  recommendations?: string[];
}

export interface RewriteResult {
  rewrittenText: string;
  explanation?: string;
  scores?: Partial<WritingScores>;
}

export type RewriteAction =
  | "grammar_fix"
  | "spelling_fix"
  | "punctuation_fix"
  | "improve_clarity"
  | "make_professional"
  | "make_friendly"
  | "make_persuasive"
  | "make_concise"
  | "expand"
  | "simplify"
  | "rewrite_sentence"
  | "rewrite_paragraph"
  | "change_tone"
  | "summarize"
  | "continue_writing"
  | "improve_readability"
  | "make_seo_friendly"
  | "make_brand_aligned"
  | "features_to_benefits"
  | "rewrite_amazon"
  | "rewrite_linkedin"
  | "rewrite_email"
  | "rewrite_website";

export interface BrandVoiceContext {
  name: string;
  brandName?: string | null;
  targetAudience?: string | null;
  tone?: string | null;
  wordsToUse?: string[];
  wordsToAvoid?: string[];
  writingStyle?: string | null;
  exampleContent?: string | null;
  personality?: string | null;
  industry?: string | null;
  contentGoals?: string | null;
}

export interface StyleGuideContext {
  englishVariant?: "US" | "UK";
  forbiddenWords?: string[];
  preferredWords?: string[];
  capitalizationRules?: string | null;
  toneRules?: string | null;
  sentenceLengthPref?: string | null;
  readingLevel?: string | null;
  complianceRules?: string | null;
  industryRules?: string | null;
}

export interface PlagiarismResult {
  similarityScore: number;
  matchedSources: Array<{
    url: string;
    title?: string;
    matchPercentage: number;
    matchedText?: string;
  }>;
  highlights: Array<{
    startIndex: number;
    endIndex: number;
    text: string;
  }>;
  provider: string;
}

export interface AIDetectionResult {
  aiProbability: number;
  humanProbability: number;
  mixedEstimate: number;
  summary?: string;
  highlights: Array<{
    startIndex: number;
    endIndex: number;
    text: string;
    aiProbability: number;
  }>;
  provider: string;
  disclaimer: string;
}
