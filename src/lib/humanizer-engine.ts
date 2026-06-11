import { scoreAITells } from "@/lib/humanizer-postprocess";

const MAX_CHUNK_CHARS = 1800;

export interface TextStructure {
  hasBullets: boolean;
  hasNumberedList: boolean;
  hasMarkdownHeaders: boolean;
  paragraphCount: number;
}

export function analyzeTextStructure(text: string): TextStructure {
  return {
    hasBullets: /^[\s]*[-•*]\s/m.test(text),
    hasNumberedList: /^[\s]*\d+[.)]\s/m.test(text),
    hasMarkdownHeaders: /^#{1,3}\s/m.test(text),
    paragraphCount: text.split(/\n\s*\n/).filter(Boolean).length,
  };
}

/** Split text into paragraph-aware chunks for long documents */
export function splitIntoHumanizeChunks(text: string, maxChars = MAX_CHUNK_CHARS): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return [trimmed];

  const paragraphs = trimmed.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const block = para.trim();
    if (!block) continue;

    if (block.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      const sentences = block.match(/[^.!?]+[.!?]+|\S+/g) ?? [block];
      let sentenceBuf = "";
      for (const s of sentences) {
        if ((sentenceBuf + " " + s).trim().length > maxChars && sentenceBuf) {
          chunks.push(sentenceBuf.trim());
          sentenceBuf = s;
        } else {
          sentenceBuf = sentenceBuf ? `${sentenceBuf} ${s}` : s;
        }
      }
      if (sentenceBuf.trim()) chunks.push(sentenceBuf.trim());
      continue;
    }

    if ((current + "\n\n" + block).length > maxChars && current) {
      chunks.push(current.trim());
      current = block;
    } else {
      current = current ? `${current}\n\n${block}` : block;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [trimmed];
}

export function mergeHumanizeChunks(chunks: string[]): string {
  return chunks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function buildPreserveFormatNote(
  structure: TextStructure,
  preserveFormat: boolean
): string {
  if (!preserveFormat) {
    return "\n\nFormat: You may flatten markdown headers to plain text if it reads more human.";
  }

  const rules: string[] = ["\n\nFormat preservation (required):"];
  if (structure.hasMarkdownHeaders) {
    rules.push("- Keep heading hierarchy (# / ## / ###) in the same places");
  }
  if (structure.hasBullets) {
    rules.push("- Keep bullet lists (- or •) with the same number of items");
  }
  if (structure.hasNumberedList) {
    rules.push("- Keep numbered lists in the same order");
  }
  rules.push("- Keep paragraph breaks in roughly the same positions");
  return rules.join("\n");
}

/** Heuristic: should we run another humanize pass? */
export function needsAnotherPass(text: string, passIndex: number, maxPasses: number): boolean {
  if (passIndex >= maxPasses) return false;
  return scoreAITells(text) >= 2;
}

export function estimateHumanScore(text: string): number {
  const tells = scoreAITells(text);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 8);
  if (sentences.length === 0) return 85;

  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
  const burstiness = Math.sqrt(variance);

  let score = 92;
  score -= tells * 8;
  if (burstiness < 4) score -= 15;
  if (!/\b(don't|won't|it's|can't|isn't|they're|we're|I'm)\b/i.test(text)) score -= 8;
  if (/^#{1,3}\s/m.test(text)) score -= 5;

  return Math.max(5, Math.min(98, score));
}
