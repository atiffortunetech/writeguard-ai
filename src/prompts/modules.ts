export const AMAZON_LISTING_SYSTEM = `You are WriteGuard AI Amazon listing specialist. Generate optimized Amazon product listing content.

Return ONLY valid JSON:
{
  "seoTitle": string (max 200 characters),
  "bullets": string[] (exactly 5 benefit-driven bullet points),
  "description": string,
  "backendSearchTerms": string (max 250 bytes, space-separated, no repetition from title),
  "keywordCoverageScore": number (0-100),
  "coveredKeywords": string[],
  "missingKeywords": string[],
  "improvementNotes": string[]
}

Rules:
- Avoid keyword stuffing; integrate keywords naturally
- Bullets must lead with benefits, not features
- Title must be under 200 characters
- Respect words to avoid
- Match requested tone and brand voice`;

import {
  HUMANIZER_POLISH_SYSTEM,
  HUMANIZER_VARIATION_SYSTEM,
  HUMANIZER_MODES,
  buildHumanizerPrompt,
  buildHumanizerPolishPrompt,
  buildHumanizerVariationPrompt,
  getHumanizerSystemPrompt,
  normalizeIntensity,
  type HumanizeIntensity,
} from "./humanizer";

export const CONTENT_GENERATION_SYSTEM = `You are WriteGuard AI content generator. Generate high-quality content based on the template and user inputs.

Return ONLY valid JSON:
{
  "content": string,
  "title": string (optional suggested title),
  "metadata": object (optional extra fields like metaTitle, metaDescription, etc.)
}`;

export function buildAmazonListingPrompt(input: {
  productName: string;
  brandName?: string;
  features?: string;
  targetAudience?: string;
  mainKeywords?: string;
  competitorNotes?: string;
  wordsToAvoid?: string;
  tone?: string;
  marketplace?: string;
  brandVoice?: string;
}): string {
  return [
    `Product: ${input.productName}`,
    input.brandName && `Brand: ${input.brandName}`,
    input.marketplace && `Marketplace: ${input.marketplace}`,
    input.targetAudience && `Target audience: ${input.targetAudience}`,
    input.features && `Features:\n${input.features}`,
    input.mainKeywords && `Main keywords: ${input.mainKeywords}`,
    input.competitorNotes && `Competitor notes: ${input.competitorNotes}`,
    input.wordsToAvoid && `Words to avoid: ${input.wordsToAvoid}`,
    input.tone && `Tone: ${input.tone}`,
    input.brandVoice && `Brand voice:\n${input.brandVoice}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildContentGenerationPrompt(
  templatePrompt: string,
  inputs: Record<string, string>,
  tone?: string,
  brandVoice?: string
): string {
  const inputStr = Object.entries(inputs)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  let prompt = `${templatePrompt}\n\nUser inputs:\n${inputStr}`;
  if (tone) prompt += `\n\nTone: ${tone}`;
  if (brandVoice) prompt += `\n\nBrand voice:\n${brandVoice}`;
  return prompt;
}
