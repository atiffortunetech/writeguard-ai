export const PARAPHRASE_MODES = [
  {
    id: "standard",
    label: "Standard",
    description: "Same meaning, fresh wording",
  },
  {
    id: "formal",
    label: "Formal",
    description: "Professional & polished",
  },
  {
    id: "casual",
    label: "Casual",
    description: "Friendly, conversational",
  },
  {
    id: "concise",
    label: "Concise",
    description: "Shorter, same points",
  },
  {
    id: "fluent",
    label: "Fluent",
    description: "Smoother flow & clarity",
  },
  {
    id: "creative",
    label: "Creative",
    description: "Vivid, engaging language",
  },
] as const;

export type ParaphraseModeId = (typeof PARAPHRASE_MODES)[number]["id"];

export const PARAPHRASE_MODE_IDS = PARAPHRASE_MODES.map((m) => m.id) as [
  ParaphraseModeId,
  ...ParaphraseModeId[],
];

export function getParaphraseInstruction(mode: ParaphraseModeId): string {
  const map: Record<ParaphraseModeId, string> = {
    standard:
      "Paraphrase the text with completely fresh wording and sentence structures while preserving the exact meaning. Do not add or remove ideas.",
    formal:
      "Paraphrase in a formal, professional tone suitable for business or academic contexts. Preserve exact meaning.",
    casual:
      "Paraphrase in a warm, casual, conversational tone — natural and human. Preserve exact meaning.",
    concise:
      "Paraphrase to be significantly shorter (about 25–35% fewer words) while keeping every key point. No fluff.",
    fluent:
      "Paraphrase for maximum clarity and flow — fix awkward phrasing, improve transitions, keep meaning identical.",
    creative:
      "Paraphrase with more vivid, engaging vocabulary and varied rhythm. Stay accurate — no new claims.",
  };
  return map[mode];
}
