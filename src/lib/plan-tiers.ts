import type { PlanTier } from "@/generated/prisma/client";

export const TIER_RANK: Record<PlanTier, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
  ENTERPRISE: 3,
};

export function tierAtLeast(userTier: PlanTier, required: PlanTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}

/** Minimum plan required per feature (tool slug or module id) */
export const FEATURE_MIN_TIER: Record<string, PlanTier> = {
  // ── FREE ──
  "grammar-checker": "FREE",
  "spell-checker": "FREE",
  "tone-detector": "FREE",
  translator: "FREE",
  "writing-studio": "FREE",
  "word-counter": "FREE",
  "character-counter": "FREE",
  "paragraph-counter": "FREE",
  "sentence-counter": "FREE",
  editor: "FREE",
  documents: "FREE",
  analyze: "FREE",

  // ── PRO ──
  "sentence-checker": "PRO",
  "punctuation-checker": "PRO",
  "passive-voice-checker": "PRO",
  proofreader: "PRO",
  paraphrase: "PRO",
  "smart-rewrite": "PRO",
  humanizer: "PRO",
  "ai-humanizer": "PRO",
  "ai-detector": "PRO",
  "plagiarism-checker": "PRO",
  plagiarism: "PRO",
  "essay-checker": "PRO",
  "citation-generator": "PRO",
  "citation-finder": "PRO",
  "ai-chat": "PRO",
  "ai-agents": "PRO",
  templates: "PRO",
  "ai-writing-tools": "PRO",
  amazon: "PRO",
  "brand-voice": "PRO",
  "brand-tones": "PRO",
  "resume-builder": "PRO",
  snippets: "PRO",
  rewrite: "PRO",
  "amazon-listing": "PRO",
  "brand-images": "PRO",
  "brand-image-studio": "PRO",

  // ── BUSINESS ──
  "style-guide": "BUSINESS",
  team: "BUSINESS",
  "writing-analytics": "BUSINESS",
  authorship: "BUSINESS",
  "ai-grader": "BUSINESS",
  "reader-reactions": "BUSINESS",
};

export function featureIdForToolSlug(slug: string): string {
  const map: Record<string, string> = {
    "plagiarism-checker": "plagiarism",
    "ai-humanizer": "humanizer",
    "ai-detector": "ai-detector",
    "brand-tones": "brand-voice",
    "style-guide": "style-guide",
    "writing-analytics": "writing-analytics",
    "ai-writing-tools": "templates",
  };
  return map[slug] ?? slug;
}

export const PLAN_FEATURE_SUMMARY: Record<PlanTier, string[]> = {
  FREE: [
    "Grammar & spell checker",
    "Writing Studio — full intelligence scan",
    "Translator (40+ languages) & tone detector",
    "Word / character / sentence counters",
    "5 documents",
    "50 AI credits / month",
    "Basic editor",
  ],
  PRO: [
    "Everything in Free",
    "Unlimited documents",
    "2,000 AI credits / month",
    "Proofreader, paraphrase, Smart Rewrite (8 modes), humanizer",
    "Plagiarism & AI detector",
    "Essay & citation tools",
    "AI chat & AI agents",
    "Brand voice & templates",
    "Amazon listing optimizer",
    "Resume builder & snippets",
    "Brand Image Studio (OpenAI)",
  ],
  BUSINESS: [
    "Everything in Pro",
    "10,000 AI credits / month",
    "Team workspace",
    "Style guide",
    "Writing analytics",
    "Authorship analysis",
    "AI grader & reader reactions",
    "20 brand voice profiles",
  ],
  ENTERPRISE: [
    "Everything in Business",
    "Unlimited AI credits",
    "Unlimited brand voices",
    "Priority support",
    "Custom limits & SSO (coming soon)",
  ],
};

export function isFeatureUnlockedForTier(
  featureId: string,
  tier: PlanTier
): boolean {
  const required = FEATURE_MIN_TIER[featureId] ?? "PRO";
  return tierAtLeast(tier, required);
}

export function getUnlockedFeatures(tier: PlanTier): string[] {
  return Object.entries(FEATURE_MIN_TIER)
    .filter(([, minTier]) => tierAtLeast(tier, minTier))
    .map(([id]) => id);
}
