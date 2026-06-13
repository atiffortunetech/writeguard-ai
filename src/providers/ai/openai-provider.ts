import { enhanceSystemPrompt } from "@/prompts/intelligence-layer";
import OpenAI from "openai";
import type {
  AnalysisResult,
  BrandVoiceContext,
  RewriteAction,
  RewriteResult,
  StyleGuideContext,
} from "@/types/ai";
import {
  GRAMMAR_ANALYSIS_SYSTEM,
  buildGrammarAnalysisPrompt,
  REWRITE_SYSTEM,
  buildRewritePrompt,
  formatBrandVoiceContext,
} from "@/prompts/writing";
import {
  AMAZON_LISTING_SYSTEM,
  CONTENT_GENERATION_SYSTEM,
  buildAmazonListingPrompt,
  buildContentGenerationPrompt,
} from "@/prompts/modules";
import {
  HUMANIZER_POLISH_SYSTEM,
  HUMANIZER_VARIATION_SYSTEM,
  buildHumanizerPrompt,
  buildHumanizerPolishPrompt,
  buildHumanizerVariationPrompt,
  getHumanizerSystemPrompt,
  HUMANIZE_INTENSITY_META,
  type HumanizeIntensity,
} from "@/prompts/humanizer";
import {
  analyzeTextStructure,
  buildPreserveFormatNote,
  estimateHumanScore,
  mergeHumanizeChunks,
  needsAnotherPass,
  splitIntoHumanizeChunks,
} from "@/lib/humanizer-engine";
import { postProcessHumanizedText } from "@/lib/humanizer-postprocess";

export interface AmazonListingResult {
  seoTitle: string;
  bullets: string[];
  description: string;
  backendSearchTerms: string;
  keywordCoverageScore: number;
  coveredKeywords: string[];
  missingKeywords: string[];
  improvementNotes: string[];
}

export interface HumanizeResult {
  humanizedText: string;
  explanation: string;
  changesSummary: string[];
  humanScore?: number;
  passesUsed?: number;
}

export interface ContentGenerationResult {
  content: string;
  title?: string;
  metadata?: Record<string, string>;
}

export interface AIProvider {
  analyzeGrammar(
    text: string,
    context?: {
      brandVoice?: BrandVoiceContext;
      styleGuide?: StyleGuideContext;
    }
  ): Promise<AnalysisResult>;
  rewrite(
    text: string,
    action: RewriteAction,
    context?: {
      targetTone?: string;
      brandVoice?: BrandVoiceContext;
    }
  ): Promise<RewriteResult>;
  generateAmazonListing(
    input: Parameters<typeof buildAmazonListingPrompt>[0]
  ): Promise<AmazonListingResult>;
  humanize(
    text: string,
    mode: string,
    brandVoice?: BrandVoiceContext,
    options?: { intensity?: HumanizeIntensity; preserveFormat?: boolean }
  ): Promise<HumanizeResult>;
  generateContent(
    templatePrompt: string,
    inputs: Record<string, string>,
    tone?: string,
    brandVoice?: BrandVoiceContext
  ): Promise<ContentGenerationResult>;
}

function formatStyleGuide(sg: StyleGuideContext): string {
  return [
    sg.englishVariant && `English: ${sg.englishVariant}`,
    sg.forbiddenWords?.length && `Forbidden: ${sg.forbiddenWords.join(", ")}`,
    sg.preferredWords?.length && `Preferred: ${sg.preferredWords.join(", ")}`,
    sg.capitalizationRules && `Capitalization: ${sg.capitalizationRules}`,
    sg.toneRules && `Tone rules: ${sg.toneRules}`,
    sg.sentenceLengthPref && `Sentence length: ${sg.sentenceLengthPref}`,
    sg.readingLevel && `Reading level: ${sg.readingLevel}`,
    sg.complianceRules && `Compliance: ${sg.complianceRules}`,
    sg.industryRules && `Industry: ${sg.industryRules}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function parseJSON<T>(content: string): T {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

export class OpenAIProvider implements AIProvider {
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
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  private async chat(
    system: string,
    user: string,
    options?: { temperature?: number; model?: string }
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? this.model,
      messages: [
        { role: "system", content: enhanceSystemPrompt(system) },
        { role: "user", content: user },
      ],
      temperature: options?.temperature ?? 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");
    return content;
  }

  private getHumanizerModel(): string {
    return process.env.OPENAI_HUMANIZER_MODEL || this.model;
  }

  async analyzeGrammar(
    text: string,
    context?: {
      brandVoice?: BrandVoiceContext;
      styleGuide?: StyleGuideContext;
    }
  ): Promise<AnalysisResult> {
    const brandVoiceStr = context?.brandVoice
      ? formatBrandVoiceContext(context.brandVoice)
      : undefined;
    const styleGuideStr = context?.styleGuide
      ? formatStyleGuide(context.styleGuide)
      : undefined;

    const userPrompt = buildGrammarAnalysisPrompt(
      text,
      brandVoiceStr,
      styleGuideStr
    );
    const raw = await this.chat(GRAMMAR_ANALYSIS_SYSTEM, userPrompt);
    return parseJSON<AnalysisResult>(raw);
  }

  async rewrite(
    text: string,
    action: RewriteAction,
    context?: {
      targetTone?: string;
      brandVoice?: BrandVoiceContext;
    }
  ): Promise<RewriteResult> {
    const brandVoiceStr = context?.brandVoice
      ? formatBrandVoiceContext(context.brandVoice)
      : undefined;

    const userPrompt = buildRewritePrompt(
      text,
      action,
      context?.targetTone,
      brandVoiceStr
    );
    const raw = await this.chat(REWRITE_SYSTEM, userPrompt);
    return parseJSON<RewriteResult>(raw);
  }

  async generateAmazonListing(
    input: Parameters<typeof buildAmazonListingPrompt>[0]
  ): Promise<AmazonListingResult> {
    const prompt = buildAmazonListingPrompt(input);
    const raw = await this.chat(AMAZON_LISTING_SYSTEM, prompt);
    return parseJSON<AmazonListingResult>(raw);
  }

  async humanize(
    text: string,
    mode: string,
    brandVoice?: BrandVoiceContext,
    options?: { intensity?: HumanizeIntensity; preserveFormat?: boolean }
  ): Promise<HumanizeResult> {
    const intensity = options?.intensity ?? "enhanced";
    const meta = HUMANIZE_INTENSITY_META[intensity];
    const humanizerModel = this.getHumanizerModel();
    const brandVoiceStr = brandVoice
      ? formatBrandVoiceContext(brandVoice)
      : undefined;

    const structure = analyzeTextStructure(text);
    const preserveFormatNote = buildPreserveFormatNote(
      structure,
      options?.preserveFormat ?? true
    );

    const tempMap: Record<HumanizeIntensity, number> = {
      quality: 0.72,
      balanced: 0.86,
      enhanced: 0.94,
    };

    let passesUsed = 0;
    const allChanges: string[] = [];

    const runPass = async (
      system: string,
      user: string,
      temperature: number
    ): Promise<HumanizeResult> => {
      passesUsed++;
      const raw = await this.chat(system, user, {
        temperature,
        model: humanizerModel,
      });
      return parseJSON<HumanizeResult>(raw);
    };

    const humanizeBlock = async (block: string, chunkIndex?: number, chunkTotal?: number) => {
      const system = getHumanizerSystemPrompt(intensity);
      const prompt = buildHumanizerPrompt(block, mode, {
        brandVoice: brandVoiceStr,
        intensity,
        preserveFormatNote,
        chunkIndex,
        chunkTotal,
      });

      let blockResult = await runPass(system, prompt, tempMap[intensity]);
      allChanges.push(...(blockResult.changesSummary ?? []));

      if (meta.passes >= 2) {
        const polished = await runPass(
          HUMANIZER_POLISH_SYSTEM,
          buildHumanizerPolishPrompt(blockResult.humanizedText, "Polish pass"),
          tempMap[intensity] - 0.04
        );
        blockResult = polished;
        allChanges.push(...(polished.changesSummary ?? []));
      }

      return blockResult.humanizedText;
    };

    let humanizedText: string;

    if (meta.chunk && text.length > 1800) {
      const chunks = splitIntoHumanizeChunks(text);
      const processed: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        processed.push(await humanizeBlock(chunks[i], i, chunks.length));
      }
      humanizedText = mergeHumanizeChunks(processed);
    } else {
      humanizedText = await humanizeBlock(text);
    }

    if (meta.passes >= 3) {
      const variation = await runPass(
        HUMANIZER_VARIATION_SYSTEM,
        buildHumanizerVariationPrompt(humanizedText),
        0.9
      );
      humanizedText = variation.humanizedText;
      allChanges.push(...(variation.changesSummary ?? []));
    }

    humanizedText = postProcessHumanizedText(humanizedText);

    let extraPass = 0;
    while (needsAnotherPass(humanizedText, extraPass, 2) && intensity === "enhanced") {
      const retry = await runPass(
        getHumanizerSystemPrompt("enhanced"),
        buildHumanizerVariationPrompt(humanizedText),
        0.93
      );
      humanizedText = postProcessHumanizedText(retry.humanizedText);
      allChanges.push("Auto re-pass to reduce AI detection signals");
      extraPass++;
    }

    const humanScore = estimateHumanScore(humanizedText);

    return {
      humanizedText,
      explanation: `Humanized with ${HUMANIZE_INTENSITY_META[intensity].label} mode (${passesUsed} AI passes). Estimated human-likeness: ${humanScore}%.`,
      changesSummary: [...new Set(allChanges)].slice(0, 8),
      humanScore,
      passesUsed,
    };
  }

  async generateContent(
    templatePrompt: string,
    inputs: Record<string, string>,
    tone?: string,
    brandVoice?: BrandVoiceContext
  ): Promise<ContentGenerationResult> {
    const brandVoiceStr = brandVoice
      ? formatBrandVoiceContext(brandVoice)
      : undefined;
    const prompt = buildContentGenerationPrompt(
      templatePrompt,
      inputs,
      tone,
      brandVoiceStr
    );
    const raw = await this.chat(CONTENT_GENERATION_SYSTEM, prompt);
    return parseJSON<ContentGenerationResult>(raw);
  }
}

let aiProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!aiProvider) {
    aiProvider = new OpenAIProvider();
  }
  return aiProvider;
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
