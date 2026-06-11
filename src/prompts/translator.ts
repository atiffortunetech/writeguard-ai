export const TRANSLATOR_RESPONSE_SCHEMA = `Return ONLY valid JSON:
{
  "result": string (the full translation in the target language — output ONLY the translated text, no quotes or labels),
  "detectedSourceLanguage": string (language name if source was auto-detected, else omit),
  "summary": string (one short sentence: e.g. "Translated from Urdu to English")
}`;

export const TRANSLATOR_SYSTEM = `You are an expert professional translator with native-level fluency in all major world languages.

Rules:
- Translate accurately and naturally — not word-for-word unless the source requires literal translation.
- Preserve meaning, tone, formality, and cultural nuance.
- Use correct script and orthography (e.g. Nastaliq-style Urdu in Arabic script, proper diacritics when standard for the language).
- Keep names, brands, URLs, numbers, and code snippets unchanged unless they have established translations.
- For poetry, idioms, or slang: translate the meaning, not literal words.
- Do NOT add explanations, notes, or the original text in the output.
- If the input mixes languages, translate all non-target-language parts into the target language.

${TRANSLATOR_RESPONSE_SCHEMA}`;

export function buildTranslatorUserMessage(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options?: { formality?: string; domain?: string }
): string {
  const sourceLine =
    sourceLanguage === "auto"
      ? "Source language: Auto-detect from the text"
      : `Source language: ${sourceLanguage}`;

  const formalityLine = options?.formality
    ? `Formality: ${options.formality}`
    : "Formality: Match the source tone";
  const domainLine = options?.domain
    ? `Domain/context: ${options.domain} — use appropriate terminology`
    : "";

  return `${sourceLine}
Target language: ${targetLanguage}
${formalityLine}
${domainLine}

Translate the following text:

"""
${text}
"""`;
}
