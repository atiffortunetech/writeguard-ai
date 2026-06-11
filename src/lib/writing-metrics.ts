/** Local writing metrics (no AI) — readability, structure, pacing. */

export interface WritingMetrics {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  avgWordsPerSentence: number;
  avgSentenceLength: number;
  readingTimeMinutes: number;
  readingTimeLabel: string;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  readabilityLabel: string;
  longSentences: number;
  veryLongSentences: number;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let processed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  processed = processed.replace(/^y/, "");
  const matches = processed.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function splitWords(text: string): string[] {
  return text.match(/[a-zA-Z0-9']+/g) ?? [];
}

function readabilityLabel(score: number): string {
  if (score >= 90) return "Very easy to read";
  if (score >= 80) return "Easy to read";
  if (score >= 70) return "Fairly easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly difficult";
  if (score >= 30) return "Difficult";
  return "Very difficult";
}

export function computeWritingMetrics(text: string): WritingMetrics {
  const trimmed = text.trim();
  const words = splitWords(trimmed);
  const wordCount = words.length;
  const characters = trimmed.length;
  const charactersNoSpaces = trimmed.replace(/\s/g, "").length;
  const sentences = splitSentences(trimmed);
  const sentenceCount = Math.max(sentences.length, 1);
  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length || 1;

  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0) || 1;
  const avgWordsPerSentence = wordCount / sentenceCount;

  const fleschReadingEase =
    wordCount > 0
      ? Math.round(
          206.835 -
            1.015 * (wordCount / sentenceCount) -
            84.6 * (syllables / wordCount)
        )
      : 0;
  const clampedEase = Math.max(0, Math.min(100, fleschReadingEase));
  const fleschKincaidGrade = Math.max(
    0,
    Math.round(0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59)
  );

  const readingTimeMinutes = wordCount / 200;
  const readingTimeLabel =
    readingTimeMinutes < 1
      ? `${Math.max(1, Math.round(wordCount / 3.3))} sec read`
      : `${Math.ceil(readingTimeMinutes)} min read`;

  let longSentences = 0;
  let veryLongSentences = 0;
  for (const s of sentences) {
    const wc = splitWords(s).length;
    if (wc > 25) longSentences++;
    if (wc > 40) veryLongSentences++;
  }

  return {
    words: wordCount,
    characters,
    charactersNoSpaces,
    sentences: sentenceCount,
    paragraphs,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSentenceLength: Math.round(avgWordsPerSentence * 10) / 10,
    readingTimeMinutes,
    readingTimeLabel,
    fleschReadingEase: clampedEase,
    fleschKincaidGrade,
    readabilityLabel: readabilityLabel(clampedEase),
    longSentences,
    veryLongSentences,
  };
}
