export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

export function computeTextStats(text: string): TextStats {
  const trimmed = text.trim();
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const sentences = trimmed
    ? (trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).filter((s) => s.trim().length > 0)
        .length
    : 0;
  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    : 0;

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences: Math.max(sentences, words > 0 ? 1 : 0),
    paragraphs: Math.max(paragraphs, words > 0 ? 1 : 0),
    readingTimeMinutes: Math.max(1, Math.ceil(words / 200)),
    speakingTimeMinutes: Math.max(1, Math.ceil(words / 130)),
  };
}
