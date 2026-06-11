export const SMART_REWRITE_MODES = [
  {
    id: "professional",
    label: "Professional",
    description: "Polished business tone",
  },
  {
    id: "casual",
    label: "Casual",
    description: "Friendly and conversational",
  },
  {
    id: "shorter",
    label: "Make shorter",
    description: "Cut length ~30–40%",
  },
  {
    id: "longer",
    label: "Expand",
    description: "Add detail and depth",
  },
  {
    id: "simpler",
    label: "Simplify",
    description: "Easier words, shorter sentences",
  },
  {
    id: "persuasive",
    label: "Persuasive",
    description: "Sales & marketing punch",
  },
  {
    id: "creative",
    label: "Creative",
    description: "Vivid, engaging language",
  },
  {
    id: "academic",
    label: "Academic",
    description: "Formal scholarly tone",
  },
] as const;

export type SmartRewriteModeId = (typeof SMART_REWRITE_MODES)[number]["id"];

export const SMART_REWRITE_MODE_IDS = SMART_REWRITE_MODES.map((m) => m.id);

export function getSmartRewriteInstruction(mode: SmartRewriteModeId): string {
  const map: Record<SmartRewriteModeId, string> = {
    professional:
      "Rewrite in a professional, confident business tone. Remove slang. Keep meaning exact.",
    casual:
      "Rewrite in a warm, casual, conversational tone — like talking to a colleague.",
    shorter:
      "Rewrite to be significantly shorter (about 30–40% fewer words) while keeping all key points.",
    longer:
      "Expand with useful detail, examples, and transitions. Roughly 25–40% longer.",
    simpler:
      "Simplify vocabulary and shorten sentences for grade 8–10 reading level.",
    persuasive:
      "Rewrite to persuade — stronger hooks, benefits, and calls to action. Marketing-ready.",
    creative:
      "Rewrite with vivid, creative language and varied rhythm. Engaging but not cheesy.",
    academic:
      "Rewrite in formal academic style — objective, precise, suitable for essays and papers.",
  };
  return map[mode];
}
