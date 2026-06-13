/**
 * WriteGuard Intelligence Layer — reasoning modes inspired by popular
 * ChatGPT prompt patterns (EXPOSE, IQ200, AUTOPSY, X10THINK, KILLCRITIC).
 * These are instruction text, not magic API switches.
 */

export type IntelligenceModeId =
  | "expose"
  | "iq200"
  | "autopsy"
  | "x10think"
  | "killcritic";

export const INTELLIGENCE_MODES: Record<
  IntelligenceModeId,
  { label: string; instruction: string }
> = {
  expose: {
    label: "EXPOSE",
    instruction:
      "EXPOSE: Surface hidden assumptions, unstated risks, blind spots, and what the text or argument leaves unsaid.",
  },
  iq200: {
    label: "IQ200",
    instruction:
      "IQ200: Use rigorous step-by-step reasoning. Prefer precision, nuance, and depth over shallow or generic answers.",
  },
  autopsy: {
    label: "AUTOPSY",
    instruction:
      "AUTOPSY: Dissect the subject structurally — break it into components, examine each part critically, then synthesize findings.",
  },
  x10think: {
    label: "X10THINK",
    instruction:
      "X10THINK: Think 10× deeper before responding. Include edge cases, second-order effects, trade-offs, and practical implications.",
  },
  killcritic: {
    label: "KILLCRITIC",
    instruction:
      "KILLCRITIC: Do not flatter or rubber-stamp. Actively find flaws, weak logic, missing details, unrealistic assumptions, and failure modes.",
  },
};

const MODE_ALIASES: Record<string, IntelligenceModeId> = {
  expose: "expose",
  iq200: "iq200",
  autopsy: "autopsy",
  atopsy: "autopsy",
  x10think: "x10think",
  "10xthink": "x10think",
  "10x-think": "x10think",
  "10x think": "x10think",
  killcritic: "killcritic",
  "kill-critic": "killcritic",
};

const DEFAULT_MODES: IntelligenceModeId[] = [
  "expose",
  "iq200",
  "autopsy",
  "x10think",
  "killcritic",
];

function parseModeList(raw: string | undefined): IntelligenceModeId[] {
  if (!raw || raw === "off" || raw === "false" || raw === "0" || raw === "none") {
    return [];
  }
  const ids = raw
    .split(",")
    .map((s) => MODE_ALIASES[s.trim().toLowerCase()])
    .filter((id): id is IntelligenceModeId => Boolean(id));
  return ids.length > 0 ? [...new Set(ids)] : DEFAULT_MODES;
}

/** Active modes — set WRITEGUARD_INTELLIGENCE_MODES=off to disable. */
export function getActiveIntelligenceModes(): IntelligenceModeId[] {
  return parseModeList(process.env.WRITEGUARD_INTELLIGENCE_MODES);
}

export function buildIntelligenceLayer(modes?: IntelligenceModeId[]): string {
  const active = modes ?? getActiveIntelligenceModes();
  if (active.length === 0) return "";

  const lines = active.map((id) => INTELLIGENCE_MODES[id].instruction);
  return [
    "",
    "--- WriteGuard Intelligence Layer ---",
    "Apply these reasoning directives to every response.",
    "You must still obey all output format, JSON schema, and task rules above.",
    ...lines,
  ].join("\n");
}

/** Append intelligence layer to any system prompt (used by all AI tools). */
export function enhanceSystemPrompt(base: string, modes?: IntelligenceModeId[]): string {
  const layer = buildIntelligenceLayer(modes);
  if (!layer) return base;
  return `${base}${layer}`;
}

export function listIntelligenceModes(): Array<{
  id: IntelligenceModeId;
  label: string;
  active: boolean;
}> {
  const active = new Set(getActiveIntelligenceModes());
  return (Object.keys(INTELLIGENCE_MODES) as IntelligenceModeId[]).map((id) => ({
    id,
    label: INTELLIGENCE_MODES[id].label,
    active: active.has(id),
  }));
}
