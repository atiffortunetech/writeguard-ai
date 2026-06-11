export const GRAMMAR_ANALYSIS_SYSTEM = `You are WriteGuard AI, an expert writing assistant. Analyze text for grammar, spelling, punctuation, clarity, tone, readability, and brand alignment.

Return ONLY valid JSON matching this schema:
{
  "overallScore": number (0-100),
  "grammarScore": number (0-100),
  "clarityScore": number (0-100),
  "toneScore": number (0-100),
  "readabilityScore": number (0-100),
  "engagementScore": number (0-100),
  "brandScore": number (0-100),
  "seoScore": number (0-100),
  "conversionScore": number (0-100),
  "detectedTones": string[],
  "recommendations": string[],
  "suggestions": [
    {
      "id": string,
      "type": "grammar" | "spelling" | "clarity" | "tone" | "conciseness" | "rewrite" | "brand_voice" | "readability" | "punctuation",
      "severity": "low" | "medium" | "high",
      "originalText": string,
      "suggestedText": string,
      "explanation": string,
      "startIndex": number,
      "endIndex": number
    }
  ]
}

Rules:
- startIndex and endIndex are character positions in the original plain text
- Provide actionable explanations for each suggestion
- Be thorough but avoid nitpicking stylistic preferences unless they hurt clarity
- Never include markdown or text outside the JSON object`;

export function buildGrammarAnalysisPrompt(
  text: string,
  brandVoice?: string,
  styleGuide?: string
): string {
  let prompt = `Analyze the following text:\n\n"""${text}"""`;

  if (brandVoice) {
    prompt += `\n\nBrand voice guidelines:\n${brandVoice}`;
  }
  if (styleGuide) {
    prompt += `\n\nStyle guide rules:\n${styleGuide}`;
  }

  return prompt;
}

export const REWRITE_SYSTEM = `You are WriteGuard AI, an expert writing assistant. Rewrite text according to the user's requested action while preserving meaning unless explicitly asked to change it.

Return ONLY valid JSON:
{
  "rewrittenText": string,
  "explanation": string,
  "scores": {
    "grammarScore": number,
    "clarityScore": number,
    "toneScore": number,
    "readabilityScore": number
  }
}`;

export const REWRITE_ACTION_INSTRUCTIONS: Record<string, string> = {
  grammar_fix: "Fix all grammar errors while preserving the original meaning and tone.",
  spelling_fix: "Fix all spelling errors only.",
  punctuation_fix: "Fix punctuation issues only.",
  improve_clarity: "Improve clarity and readability without changing the core message.",
  make_professional: "Rewrite in a professional, polished business tone.",
  make_friendly: "Rewrite in a warm, friendly, approachable tone.",
  make_persuasive: "Rewrite to be more persuasive and compelling.",
  make_concise: "Make the text more concise without losing key information.",
  expand: "Expand the text with relevant detail and context.",
  simplify: "Simplify language for easier understanding.",
  rewrite_sentence: "Rewrite the selected sentence for better flow and impact.",
  rewrite_paragraph: "Rewrite the paragraph for improved structure and clarity.",
  change_tone: "Rewrite to match the target tone specified by the user.",
  summarize: "Summarize the text concisely while keeping key points.",
  continue_writing: "Continue writing naturally from where the text ends.",
  improve_readability: "Improve readability with shorter sentences and clearer structure.",
  make_seo_friendly: "Optimize for SEO with natural keyword integration.",
  make_brand_aligned: "Align the text with the provided brand voice guidelines.",
  features_to_benefits: "Convert feature-focused language into customer benefit language.",
  rewrite_amazon: "Rewrite as compelling Amazon product listing copy with benefit-driven bullets.",
  rewrite_linkedin: "Rewrite as an engaging LinkedIn post with a strong hook.",
  rewrite_email: "Rewrite as a clear, professional email.",
  rewrite_website: "Rewrite as conversion-focused website copy.",
};

export function buildRewritePrompt(
  text: string,
  action: string,
  targetTone?: string,
  brandVoice?: string
): string {
  const instruction =
    REWRITE_ACTION_INSTRUCTIONS[action] ?? "Improve the text quality.";

  let prompt = `Action: ${action}\nInstruction: ${instruction}\n\nText:\n"""${text}"""`;

  if (targetTone) {
    prompt += `\n\nTarget tone: ${targetTone}`;
  }
  if (brandVoice) {
    prompt += `\n\nBrand voice:\n${brandVoice}`;
  }

  return prompt;
}

export const BRAND_VOICE_CHECK_SYSTEM = `You are WriteGuard AI brand voice analyst. Compare content against brand voice guidelines.

Return ONLY valid JSON:
{
  "brandScore": number (0-100),
  "suggestions": [
    {
      "id": string,
      "type": "brand_voice",
      "severity": "low" | "medium" | "high",
      "originalText": string,
      "suggestedText": string,
      "explanation": string,
      "startIndex": number,
      "endIndex": number
    }
  ],
  "summary": string
}`;

export function formatBrandVoiceContext(voice: {
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
}): string {
  return [
    `Brand: ${voice.brandName ?? voice.name}`,
    voice.targetAudience && `Audience: ${voice.targetAudience}`,
    voice.tone && `Tone: ${voice.tone}`,
    voice.personality && `Personality: ${voice.personality}`,
    voice.industry && `Industry: ${voice.industry}`,
    voice.writingStyle && `Style: ${voice.writingStyle}`,
    voice.contentGoals && `Goals: ${voice.contentGoals}`,
    voice.wordsToUse?.length && `Use: ${voice.wordsToUse.join(", ")}`,
    voice.wordsToAvoid?.length && `Avoid: ${voice.wordsToAvoid.join(", ")}`,
    voice.exampleContent && `Example:\n${voice.exampleContent}`,
  ]
    .filter(Boolean)
    .join("\n");
}
