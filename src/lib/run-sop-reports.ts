import { enhanceSystemPrompt } from "@/prompts/intelligence-layer";
import OpenAI from "openai";
import {
  buildSopReportUserPrompt,
  SOP_REPORT_SYSTEM,
  type SopReportDocumentType,
  type SopReportLength,
  type SopReportTone,
} from "@/prompts/sop-reports";
import { trimAttachmentsForPrompt } from "@/lib/sop-report-attachments";

export interface SopReportSection {
  heading: string;
  content: string;
}

export interface SopReportResult {
  title: string;
  documentType: string;
  summary: string;
  sections: SopReportSection[];
  fullDocument: string;
}

export interface SopReportInput {
  documentType: SopReportDocumentType;
  title: string;
  topic: string;
  audience?: string;
  department?: string;
  tone?: SopReportTone;
  length?: SopReportLength;
  additionalNotes?: string;
  attachments?: Array<{ name: string; content: string }>;
}

export async function runSopReportGenerator(
  input: SopReportInput
): Promise<SopReportResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const model =
    process.env.OPENAI_INTELLIGENCE_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: enhanceSystemPrompt(SOP_REPORT_SYSTEM) },
      {
        role: "user",
        content: buildSopReportUserPrompt({
          ...input,
          topic: input.topic.trim().slice(0, 8000),
          attachments: input.attachments?.length
            ? trimAttachmentsForPrompt(input.attachments)
            : undefined,
        }),
      },
    ],
    temperature: 0.45,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");

  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()) as {
    title?: string;
    documentType?: string;
    summary?: string;
    sections?: SopReportSection[];
    fullDocument?: string;
  };

  const sections = Array.isArray(parsed.sections) ? parsed.sections : [];

  return {
    title: parsed.title ?? input.title,
    documentType: parsed.documentType ?? input.documentType,
    summary: parsed.summary ?? "",
    sections,
    fullDocument:
      parsed.fullDocument ??
      sections.map((s) => `${s.heading}\n\n${s.content}`).join("\n\n"),
  };
}
