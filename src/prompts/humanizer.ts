/** Phrases and patterns that flag content as AI-generated on detectors like Copyleaks */
export const AI_TELLTALE_PHRASES = [
  "delve",
  "landscape",
  "robust",
  "comprehensive",
  "leverage",
  "furthermore",
  "moreover",
  "additionally",
  "it's important to note",
  "it is important to note",
  "in conclusion",
  "in summary",
  "to summarize",
  "in today's world",
  "game-changer",
  "game changer",
  "cutting-edge",
  "seamlessly",
  "utilize",
  "facilitate",
  "paramount",
  "tapestry",
  "embark",
  "foster",
  "underscore",
  "pivotal",
  "vibrant",
  "at the end of the day",
  "moving forward",
  "it is worth noting",
  "plays a crucial role",
  "plays a vital role",
  "sheds light on",
  "in terms of",
  "when it comes to",
  "a wide range of",
  "various aspects",
  "rapidly evolving",
  "ever-changing",
  "holistic approach",
  "paradigm shift",
  "best practices",
  "streamline",
  "navigate the",
  "unlock the",
  "empower",
  "elevate your",
  "dive into",
  "deep dive",
  "ensure that",
  "in order to",
  "as a result of",
  "on the other hand",
  "that being said",
  "needless to say",
  "without a doubt",
  "rest assured",
  "look no further",
  "it's essential to",
  "this highlights",
  "this demonstrates",
  "in the realm of",
  "serves as a",
  "a testament to",
];

/** aihumanize.io-style tiers: quality (light) → balanced → enhanced (heavy) */
export type HumanizeIntensity = "quality" | "balanced" | "enhanced";

export const HUMANIZE_INTENSITY_META: Record<
  HumanizeIntensity,
  { label: string; description: string; passes: number; chunk: boolean }
> = {
  quality: {
    label: "Quality",
    description: "Light touch — fixes flow and obvious AI phrasing. Fast.",
    passes: 1,
    chunk: false,
  },
  balanced: {
    label: "Balanced",
    description: "Restructures sentences and tone. Good for most content.",
    passes: 2,
    chunk: false,
  },
  enhanced: {
    label: "Enhanced",
    description: "Deep multi-pass rewrite — closest to premium humanizer tools.",
    passes: 3,
    chunk: true,
  },
};

const BANNED_SAMPLE = AI_TELLTALE_PHRASES.slice(0, 35).join(", ");

export const HUMANIZER_QUALITY_SYSTEM = `You are a skilled editor performing LIGHT humanization (Quality mode).

Return ONLY valid JSON:
{
  "humanizedText": string,
  "explanation": string,
  "changesSummary": string[]
}

Goal: Make AI text sound naturally human with MINIMAL structural change.
- Swap stiff words for plain ones (use → use, not utilize)
- Add contractions where natural
- Fix robotic transitions
- Slightly vary sentence openings
- Keep paragraph structure almost identical
- Do NOT add or remove facts
- Avoid: ${BANNED_SAMPLE}`;

export const HUMANIZER_BALANCED_SYSTEM = `You are an expert human writer performing BALANCED humanization.

Return ONLY valid JSON:
{
  "humanizedText": string,
  "explanation": string,
  "changesSummary": string[]
}

Goal: Restructure sentences while preserving meaning — like aihumanize.io Balanced mode.
- Mix short punchy sentences (4-8 words) with longer ones (18-30 words)
- Rewrite every sentence — do NOT just synonym-swap
- Use contractions, casual connectors (So, But, And)
- Remove ALL AI clichés: ${BANNED_SAMPLE}
- Sound like a real person wrote this, not a polished blog
- Keep all facts, names, numbers, policy terms
- Uneven rhythm is GOOD — uniform rhythm is BAD`;

export const HUMANIZER_ENHANCED_SYSTEM = `You are the world's best AI-to-human rewriter (Enhanced / Heavy mode).

Return ONLY valid JSON:
{
  "humanizedText": string,
  "explanation": string,
  "changesSummary": string[]
}

This must pass Copyleaks, GPTZero, and Turnitin-style detectors. Rewrite like aihumanize.io Enhanced output.

MANDATORY techniques:
1. PERPLEXITY: Unpredictable word choices. "tough" not "challenging", "fix" not "address", "a lot" not "numerous"
2. BURSTINESS: Never 3+ sentences of similar length. One fragment sentence is OK.
3. NO AI VOCABULARY: Zero use of ${BANNED_SAMPLE}
4. HUMAN IMPERFECTION: Start some sentences with And/But/So. Parenthetical asides OK.
5. NO ENCYCLOPEDIA TONE: Write like you're explaining to a colleague, not writing a report
6. REORGANIZE: Change sentence order within paragraphs if it still makes sense
7. NO markdown ### headers unless source had them — use plain text or simple bold-style phrasing
8. Keep every fact, statistic, acronym (OTDR, FBA, etc.) exactly accurate

Output must NOT read like it was paraphrased by AI. It should read like someone typed it fresh.`;

export const HUMANIZER_POLISH_SYSTEM = `Final polish pass. Text still fails AI detectors. Make it MORE human, LESS perfect.

Return ONLY valid JSON:
{
  "humanizedText": string,
  "explanation": string,
  "changesSummary": string[]
}

- Increase sentence length variation
- Remove any remaining formal words
- Add one conversational hook if missing (question, "Look,", "Here's the thing:")
- Shorter is fine — don't pad
- Keep all facts`;

export const HUMANIZER_VARIATION_SYSTEM = `Variation pass — rewrite again with a DIFFERENT human voice than the last version.

Return ONLY valid JSON:
{
  "humanizedText": string,
  "explanation": string,
  "changesSummary": string[]
}

Same facts, completely different sentence structures and word choices from the input.
Detectors flag repetitive AI patterns — your rewrite must break all patterns from the source.`;

export const HUMANIZER_MODES: Record<string, string> = {
  general: "General writing — natural blog/article voice, readable and authentic.",
  academic: "Academic but human — clear student/researcher voice, not robotic essay tone.",
  blog: "Blog post — engaging, slightly informal, hooks the reader.",
  business: "Business email/memo — professional but clearly human-written.",
  amazon_seller:
    "Amazon seller — practical FBA operator voice, uses OTDR/inbound jargon naturally.",
  marketing: "Marketing copy — persuasive without sounding like a template.",
  conversational: "Casual — like explaining to a friend over coffee.",
  professional: "Professional — direct expert voice, zero corporate fluff.",
};

export function getHumanizerSystemPrompt(intensity: HumanizeIntensity): string {
  switch (intensity) {
    case "quality":
      return HUMANIZER_QUALITY_SYSTEM;
    case "balanced":
      return HUMANIZER_BALANCED_SYSTEM;
    case "enhanced":
      return HUMANIZER_ENHANCED_SYSTEM;
  }
}

export function buildHumanizerPrompt(
  text: string,
  mode: string,
  options?: {
    brandVoice?: string;
    intensity?: HumanizeIntensity;
    preserveFormatNote?: string;
    chunkIndex?: number;
    chunkTotal?: number;
  }
): string {
  const instruction = HUMANIZER_MODES[mode] ?? HUMANIZER_MODES.general;
  const intensity = options?.intensity ?? "enhanced";

  let prompt = `Writing style: ${instruction}\nHumanization level: ${HUMANIZE_INTENSITY_META[intensity].label}`;

  if (options?.chunkIndex !== undefined && options?.chunkTotal !== undefined) {
    prompt += `\n\nProcessing part ${options.chunkIndex + 1} of ${options.chunkTotal}. Rewrite this section only — it will be merged with other parts.`;
  }

  if (options?.preserveFormatNote) {
    prompt += options.preserveFormatNote;
  }

  prompt += `\n\nText to humanize:\n"""${text}"""`;

  if (options?.brandVoice) {
    prompt += `\n\nBrand voice:\n${options.brandVoice}`;
  }

  return prompt;
}

export function buildHumanizerPolishPrompt(text: string, passLabel?: string): string {
  return `${passLabel ? `${passLabel}\n\n` : ""}Polish this draft:\n\n"""${text}"""`;
}

export function buildHumanizerVariationPrompt(text: string): string {
  return `Rewrite with a fresh human voice (variation pass):\n\n"""${text}"""`;
}

/** Map legacy intensity values from older clients */
export function normalizeIntensity(value?: string): HumanizeIntensity {
  switch (value) {
    case "quality":
    case "standard":
      return "quality";
    case "balanced":
    case "deep":
      return "balanced";
    case "enhanced":
    case "maximum":
      return "enhanced";
    default:
      return "enhanced";
  }
}
