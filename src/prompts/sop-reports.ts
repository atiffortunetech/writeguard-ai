export const SOP_REPORT_DOCUMENT_TYPES = {
  sop: {
    label: "Standard Operating Procedure (SOP)",
    description: "Step-by-step procedure with roles, scope, and compliance notes",
  },
  report: {
    label: "Full Report",
    description: "Structured report with analysis, findings, and recommendations",
  },
  "summary-report": {
    label: "Summary Report",
    description: "Concise executive summary of a topic or situation",
  },
  "process-guide": {
    label: "Process Guide",
    description: "Clear how-to guide explaining a workflow or process",
  },
} as const;

export type SopReportDocumentType = keyof typeof SOP_REPORT_DOCUMENT_TYPES;

export const SOP_REPORT_LENGTHS = {
  brief: "Brief (1–2 pages)",
  standard: "Standard (3–5 pages)",
  detailed: "Detailed (comprehensive)",
} as const;

export type SopReportLength = keyof typeof SOP_REPORT_LENGTHS;

export const SOP_REPORT_TONES = {
  professional: "Professional",
  formal: "Formal / corporate",
  technical: "Technical",
  simple: "Simple & easy to follow",
} as const;

export type SopReportTone = keyof typeof SOP_REPORT_TONES;

const TYPE_INSTRUCTIONS: Record<SopReportDocumentType, string> = {
  sop: `Write a Standard Operating Procedure (SOP) with these sections:
1. Document Control (title, version placeholder, effective date placeholder, owner placeholder)
2. Purpose
3. Scope
4. Definitions (if needed)
5. Roles & Responsibilities
6. Procedure (numbered steps, clear and actionable)
7. Safety / Compliance / Quality notes (if relevant)
8. References (if relevant)
Use imperative voice for steps. Be specific and operational.`,

  report: `Write a professional report with these sections:
1. Title page info (title, date placeholder, prepared by placeholder)
2. Executive Summary
3. Introduction / Background
4. Objectives
5. Methodology or Approach (if applicable)
6. Findings / Analysis
7. Discussion
8. Recommendations
9. Conclusion
Use clear headings, evidence-based tone, and logical flow.`,

  "summary-report": `Write a concise summary report with:
1. Title
2. Overview (2–3 paragraphs)
3. Key Points (bullet list)
4. Implications or Impact
5. Recommended Next Steps
Keep it scannable for executives and stakeholders.`,

  "process-guide": `Write a process guide with:
1. Overview — what this process is and when to use it
2. Prerequisites / Before You Begin
3. Step-by-Step Instructions (numbered, with sub-steps where needed)
4. Tips & Best Practices
5. Troubleshooting / Common Issues
6. Related Resources
Make it easy for a new team member to follow.`,
};

export const SOP_REPORT_SYSTEM = `You are WriteGuard AI, an expert business and technical writer specializing in SOPs, reports, and process documentation.

Return ONLY valid JSON:
{
  "title": string,
  "documentType": string,
  "summary": string (1-2 sentence overview of what was generated),
  "sections": [
    { "heading": string, "content": string (markdown allowed: bullets, numbered lists, bold) }
  ],
  "fullDocument": string (complete document as plain text with clear section headings)
}

Rules:
- Base content strictly on the user's topic and explanation; do not invent critical facts.
- If details are missing, use sensible placeholders marked [TO BE CONFIRMED] rather than fabricating specifics.
- Use professional, clear language appropriate to the audience.
- Match the requested length: brief = shorter sections, detailed = thorough coverage.
- fullDocument must be the complete readable document combining all sections.`;

export function buildSopReportUserPrompt(input: {
  documentType: SopReportDocumentType;
  title: string;
  topic: string;
  audience?: string;
  department?: string;
  tone?: SopReportTone;
  length?: SopReportLength;
  additionalNotes?: string;
}): string {
  const typeInstruction = TYPE_INSTRUCTIONS[input.documentType];
  const tone = input.tone ? SOP_REPORT_TONES[input.tone] : "Professional";
  const length = input.length ? SOP_REPORT_LENGTHS[input.length] : SOP_REPORT_LENGTHS.standard;

  return [
    `Document type: ${SOP_REPORT_DOCUMENT_TYPES[input.documentType].label}`,
    typeInstruction,
    "",
    `Title: ${input.title}`,
    `Topic / subject: ${input.topic}`,
    input.audience ? `Target audience: ${input.audience}` : null,
    input.department ? `Department / team: ${input.department}` : null,
    `Tone: ${tone}`,
    `Length: ${length}`,
    input.additionalNotes ? `Additional notes:\n${input.additionalNotes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
