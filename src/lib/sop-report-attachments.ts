export const SOP_ATTACHMENT_LIMITS = {
  maxCount: 5,
  maxFileBytes: 2 * 1024 * 1024,
  maxContentChars: 12_000,
  maxTotalChars: 24_000,
  accept:
    ".txt,.md,.csv,.json,.html,.htm,.xml,.log,.rtf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,application/json,text/html,text/xml,application/rtf",
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
  "rtf",
]);

function fileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsText(file);
  });
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

export async function extractSopAttachmentText(file: File): Promise<string> {
  if (file.size > SOP_ATTACHMENT_LIMITS.maxFileBytes) {
    throw new Error(`${file.name} exceeds 2 MB limit`);
  }

  const ext = fileExtension(file.name);
  const isDocx =
    ext === "docx" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  let text: string;
  if (isDocx) {
    text = await extractDocxText(file);
  } else if (TEXT_EXTENSIONS.has(ext) || file.type.startsWith("text/")) {
    text = (await readFileAsText(file)).trim();
  } else {
    throw new Error(
      `${file.name}: unsupported type. Use .txt, .md, .csv, .json, .html, or .docx`
    );
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
