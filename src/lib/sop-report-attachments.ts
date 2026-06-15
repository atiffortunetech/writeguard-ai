export const SOP_ATTACHMENT_LIMITS = {
  maxCount: 5,
  maxFileBytes: 2 * 1024 * 1024,
  maxContentChars: 12_000,
  maxTotalChars: 24_000,
  /** Max chars from attachments included in the AI prompt (avoids context overflow) */
  maxPromptAttachmentChars: 18_000,
  accept:
    ".txt,.md,.csv,.json,.html,.htm,.xml,.log,.doc,.docx,.pdf,.xlsx,.xls,.png,.jpg,.jpeg,.webp," +
    "application/pdf,application/msword," +
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
    "application/vnd.ms-excel,image/png,image/jpeg,image/webp",
} as const;

export type SopReportAttachmentPayload = {
  name: string;
  content: string;
};

export type SopReportAttachmentItem = SopReportAttachmentPayload & {
  id: string;
  size: number;
};

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

const SERVER_EXTRACT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xlsx",
  "xls",
  "png",
  "jpg",
  "jpeg",
  "webp",
]);

function fileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
}

function needsServerExtraction(file: File): boolean {
  const ext = fileExtension(file.name);
  if (SERVER_EXTRACT_EXTENSIONS.has(ext)) return true;
  if (file.type.startsWith("image/")) return true;
  if (file.type === "application/pdf") return true;
  if (
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return true;
  }
  if (
    file.type.includes("spreadsheet") ||
    file.type.includes("excel")
  ) {
    return true;
  }
  return false;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsText(file);
  });
}

async function extractViaServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/tools/sop-reports/extract-attachment", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json()) as { content?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Could not read ${file.name}`);
  }

  if (!data.content?.trim()) {
    throw new Error(`${file.name} appears empty`);
  }

  return data.content;
}

export async function extractSopAttachmentText(file: File): Promise<string> {
  if (file.size > SOP_ATTACHMENT_LIMITS.maxFileBytes) {
    throw new Error(`${file.name} exceeds 2 MB limit`);
  }

  let text: string;

  if (needsServerExtraction(file)) {
    text = await extractViaServer(file);
  } else if (TEXT_EXTENSIONS.has(fileExtension(file.name)) || file.type.startsWith("text/")) {
    text = (await readFileAsText(file)).trim();
  } else {
    text = await extractViaServer(file);
  }

  if (!text) {
    throw new Error(`${file.name} appears empty`);
  }

  if (text.length > SOP_ATTACHMENT_LIMITS.maxContentChars) {
    text = text.slice(0, SOP_ATTACHMENT_LIMITS.maxContentChars);
  }

  return text;
}

export function totalAttachmentChars(
  attachments: Pick<SopReportAttachmentPayload, "content">[]
): number {
  return attachments.reduce((sum, item) => sum + item.content.length, 0);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Trim attachment text to fit model context when building the AI prompt */
export function trimAttachmentsForPrompt(
  attachments: SopReportAttachmentPayload[],
  maxChars: number = SOP_ATTACHMENT_LIMITS.maxPromptAttachmentChars
): SopReportAttachmentPayload[] {
  let remaining = maxChars;
  const trimmed: SopReportAttachmentPayload[] = [];

  for (const file of attachments) {
    if (remaining <= 0) break;
    const content =
      file.content.length <= remaining
        ? file.content
        : `${file.content.slice(0, remaining)}\n[…truncated for length]`;
    trimmed.push({ name: file.name, content });
    remaining -= content.length;
  }

  return trimmed;
}

export function isImageAttachment(filename: string): boolean {
  const ext = fileExtension(filename);
  return ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp";
}
