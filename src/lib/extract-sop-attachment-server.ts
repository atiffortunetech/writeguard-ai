import mammoth from "mammoth";
import OpenAI from "openai";
import WordExtractor from "word-extractor";
import * as XLSX from "xlsx";
import { SOP_ATTACHMENT_LIMITS } from "@/lib/sop-report-attachments";

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "html",
  "htm",
  "xml",
  "log",
]);

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
const IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function attachmentExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
}

export function isAllowedAttachment(filename: string, mimeType: string): boolean {
  const ext = attachmentExtension(filename);
  const allowedExt = new Set([
    ...TEXT_EXTENSIONS,
    "docx",
    "doc",
    "pdf",
    "xlsx",
    "xls",
    "png",
    "jpg",
    "jpeg",
    "webp",
  ]);

  if (allowedExt.has(ext)) return true;

  if (mimeType.startsWith("text/")) return true;
  if (IMAGE_MIMES.has(mimeType)) return true;
  if (mimeType === "application/pdf") return true;
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return true;
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return true;
  }

  return false;
}

function clampContent(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= SOP_ATTACHMENT_LIMITS.maxContentChars) return trimmed;
  return trimmed.slice(0, SOP_ATTACHMENT_LIMITS.maxContentChars);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractExcelText(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return "";
    const csv = XLSX.utils.sheet_to_csv(sheet).trim();
    return csv ? `--- Sheet: ${name} ---\n${csv}` : "";
  })
    .filter(Boolean)
    .join("\n\n");
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractDocText(buffer: Buffer): Promise<string> {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  return doc.getBody();
}

async function extractImageText(buffer: Buffer, mimeType: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to read text from images");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const model =
    process.env.OPENAI_VISION_MODEL ||
    process.env.OPENAI_INTELLIGENCE_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4o-mini";

  const base64 = buffer.toString("base64");
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Extract all readable text from this image for business document generation (SOP, report, process guide). " +
              "Include headings, labels, table cells, bullet points, and body text. " +
              "Preserve structure with line breaks. Return plain text only — no markdown fences or commentary.",
          },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.1,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function extractAttachmentFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  if (buffer.length > SOP_ATTACHMENT_LIMITS.maxFileBytes) {
    throw new Error(`${filename} exceeds 2 MB limit`);
  }

  if (!isAllowedAttachment(filename, mimeType)) {
    throw new Error(
      `${filename}: unsupported type. Use PDF, Word, Excel, text files, or PNG/JPEG images`
    );
  }

  const ext = attachmentExtension(filename);
  let text = "";

  if (ext === "pdf" || mimeType === "application/pdf") {
    text = await extractPdfText(buffer);
  } else if (ext === "xlsx" || ext === "xls" || mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    text = await extractExcelText(buffer);
  } else if (
    ext === "docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = await extractDocxText(buffer);
  } else if (ext === "doc" || mimeType === "application/msword") {
    text = await extractDocText(buffer);
  } else if (
    IMAGE_EXTENSIONS.has(ext) ||
    IMAGE_MIMES.has(mimeType) ||
    mimeType.startsWith("image/")
  ) {
    const imageMime =
      mimeType.startsWith("image/") && mimeType !== "image/svg+xml"
        ? mimeType
        : ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
    text = await extractImageText(buffer, imageMime);
  } else if (TEXT_EXTENSIONS.has(ext) || mimeType.startsWith("text/") || ext === "csv") {
    text = buffer.toString("utf8");
  } else {
    throw new Error(`${filename}: could not determine how to read this file type`);
  }

  const content = clampContent(text);
  if (!content) {
    throw new Error(`${filename} appears empty or contains no extractable text`);
  }

  return content;
}

export function attachmentUsesVision(filename: string, mimeType: string): boolean {
  const ext = attachmentExtension(filename);
  return IMAGE_EXTENSIONS.has(ext) || IMAGE_MIMES.has(mimeType);
}
