import { AI_TELLTALE_PHRASES } from "@/prompts/humanizer";

/** Lightweight post-pass: swap common AI phrases and smooth robotic patterns */
export function postProcessHumanizedText(text: string): string {
  let out = text;

  const replacements: [RegExp, string][] = [
    [/\bFurthermore,?\s*/gi, ""],
    [/\bMoreover,?\s*/gi, ""],
    [/\bAdditionally,?\s*/gi, ""],
    [/\bIn conclusion,?\s*/gi, ""],
    [/\bTo summarize,?\s*/gi, ""],
    [/\bIt is worth noting that\s*/gi, ""],
    [/\bIt's worth noting that\s*/gi, ""],
    [/\bIt is important to note that\s*/gi, ""],
    [/\bIt's important to note that\s*/gi, ""],
    [/\bIn today's (?:digital )?world,?\s*/gi, ""],
    [/\bplays a (?:crucial|vital|key) role in\b/gi, "matters for"],
    [/\bin terms of\b/gi, "for"],
    [/\bwhen it comes to\b/gi, "with"],
    [/\ba wide range of\b/gi, "lots of"],
    [/\butilize\b/gi, "use"],
    [/\butilizing\b/gi, "using"],
    [/\bfacilitate\b/gi, "help"],
    [/\bleverage\b/gi, "use"],
    [/\bleveraging\b/gi, "using"],
    [/\brobust\b/gi, "solid"],
    [/\bcomprehensive\b/gi, "full"],
    [/\bseamless(?:ly)?\b/gi, "smooth"],
    [/\bstreamline\b/gi, "simplify"],
    [/\bnavigate\b/gi, "handle"],
    [/\bensure that\b/gi, "make sure"],
    [/\benhance\b/gi, "improve"],
    [/\boptimize\b/gi, "tune"],
    [/\bdelve into\b/gi, "look at"],
    [/\bembark on\b/gi, "start"],
    [/\bholistic\b/gi, "full"],
    [/\bparadigm\b/gi, "approach"],
    [/\bstakeholders\b/gi, "teams"],
    [/\bsignificant impact\b/gi, "real effect"],
    [/\brapidly evolving\b/gi, "changing fast"],
    [/\bever-changing landscape\b/gi, "shifting market"],
    [/\bcutting-edge\b/gi, "new"],
    [/\bgame-?changer\b/gi, "big deal"],
    [/\bwithout a doubt\b/gi, ""],
    [/\bneedless to say\b/gi, ""],
    [/\bthat being said\b/gi, "still,"],
    [/\bon the other hand\b/gi, "but"],
    [/\bin order to\b/gi, "to"],
    [/\b###\s+/g, ""],
    [/\b##\s+/g, ""],
    [/\s{3,}/g, "  "],
    [/\n{4,}/g, "\n\n\n"],
  ];

  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement);
  }

  // Trim orphaned commas after removed openers
  out = out.replace(/,\s*,/g, ",").replace(/^\s*,\s*/gm, "");

  return out.trim();
}

export function scoreAITells(text: string): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const phrase of AI_TELLTALE_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) hits++;
  }
  return hits;
}
