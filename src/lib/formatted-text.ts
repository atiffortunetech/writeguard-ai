/** Allowed tags when preserving Google Docs / Word paste structure */
export const ALLOWED_FORMAT_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "span",
  "div",
] as const;

export const FORMAT_PRESERVATION_INSTRUCTIONS = `
FORMATTING PRESERVATION (CRITICAL — input is HTML):
- The user pasted formatted content (Google Docs / Word style) with headings, paragraphs, bold, links, and lists.
- You MUST preserve the exact HTML structure: keep every h1–h6, p, strong/b, em/i, ul/ol/li, a[href], br, and blockquote tag.
- Only change the words inside tags as required by the task — never flatten headings to paragraphs, never remove bold, never strip tags.
- Return "resultHtml" with valid HTML using the SAME tag hierarchy and nesting as the input.
- Also return "result" as a plain-text fallback (no HTML tags).
`.trim();

export function hasRichFormatting(html: string | undefined | null): boolean {
  if (!html?.trim()) return false;
  const h = html.toLowerCase();
  if (/<h[1-6]\b/i.test(h)) return true;
  if (/<(strong|b|em|i|u)\b/i.test(h)) return true;
  if (/<(ul|ol|li|blockquote|a)\b/i.test(h)) return true;
  if (/font-weight:\s*(?:bold|[67]00)/i.test(h)) return true;
  if (/<span[^>]*style="[^"]*font-weight:\s*(?:bold|[67]00)/i.test(h)) return true;
  if ((h.match(/<p\b/gi)?.length ?? 0) > 1) return true;
  return false;
}

interface HtmlBlock {
  tag: string;
  wholeBold: boolean;
  isHeading: boolean;
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isWholeBlockBold(inner: string): boolean {
  const trimmed = inner.trim();
  return (
    /^<(?:strong|b)(?:\s[^>]*)?>[\s\S]*<\/(?:strong|b)>$/i.test(trimmed) ||
    /^<(?:strong|b)(?:\s[^>]*)?>[\s\S]*<\/(?:strong|b)>(?:<br\s*\/?>)?$/i.test(trimmed)
  );
}

export function extractHtmlBlocks(html: string): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];
  const regex = /<(h[1-6]|p|li|blockquote)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2];
    const plainInner = htmlToPlainText(inner).trim();
    if (!plainInner) continue;

    const isHeading = /^h[1-6]$/.test(tag);
    blocks.push({
      tag,
      wholeBold: isHeading || isWholeBlockBold(inner),
      isHeading,
    });
  }

  return blocks;
}

function splitTitleFromParagraph(text: string): { title: string; body: string } | null {
  const colon = text.match(/^(.{8,140}?):\s+([\s\S]+)$/);
  if (colon) return { title: `${colon[1]}:`, body: colon[2].trim() };
  const dot = text.match(/^(.{8,140}?\.)\s+([\s\S]+)$/);
  if (dot) return { title: dot[1], body: dot[2].trim() };
  return null;
}

function splitOutputParagraphs(text: string, blockCount: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return Array(blockCount).fill("");

  let parts = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length !== blockCount) {
    parts = trimmed
      .split(/\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  if (parts.length === blockCount) return parts;

  if (parts.length < blockCount) {
    while (parts.length < blockCount) parts.push("");
    return parts;
  }

  const merged = parts.slice(0, blockCount - 1);
  merged.push(parts.slice(blockCount - 1).join(" "));
  return merged;
}

function alignOutputToBlocks(outputText: string, blocks: HtmlBlock[]): string[] {
  let parts = splitOutputParagraphs(outputText, blocks.length);

  if (parts.length === blocks.length) return parts;

  if (parts.length === blocks.length - 1 && blocks[0]?.wholeBold && parts[0]) {
    const split = splitTitleFromParagraph(parts[0]);
    if (split) return [split.title, split.body, ...parts.slice(1)];
  }

  while (parts.length < blocks.length) parts.push("");
  if (parts.length > blocks.length) {
    parts = [...parts.slice(0, blocks.length - 1), parts.slice(blocks.length - 1).join(" ")];
  }
  return parts;
}

function wrapHtmlBlock(tag: string, text: string, wholeBold: boolean): string {
  const escaped = escapeHtmlText(text);
  if (!escaped) return `<${tag}></${tag}>`;
  if (/^h[1-6]$/.test(tag)) return `<${tag}>${escaped}</${tag}>`;
  if (wholeBold) return `<${tag}><strong>${escaped}</strong></${tag}>`;
  return `<${tag}>${escaped}</${tag}>`;
}

/** Re-apply input HTML block structure when AI returns plain or flattened text */
export function reapplyHtmlStructure(inputHtml: string, outputText: string): string {
  const blocks = extractHtmlBlocks(inputHtml);
  if (blocks.length === 0) return outputText;

  const paragraphs = alignOutputToBlocks(outputText, blocks);
  return blocks
    .map((block, i) => wrapHtmlBlock(block.tag, paragraphs[i] ?? "", block.wholeBold))
    .join("");
}

function hasStructuralFormatting(html: string): boolean {
  return /<h[1-6]\b|<p>\s*<(strong|b)\b|<(strong|b)[^>]*>[^<]{3,}/i.test(html);
}

function structureWasLost(inputHtml: string, outputHtml: string): boolean {
  if (!outputHtml.trim()) return true;
  if (!hasStructuralFormatting(inputHtml)) return false;

  const inputBlocks = extractHtmlBlocks(inputHtml);
  const outputBlocks = extractHtmlBlocks(outputHtml);
  if (outputBlocks.length === 0) return true;

  const inputLead = inputBlocks[0];
  const outputLead = outputBlocks[0];
  if (!inputLead || !outputLead) return true;

  if (inputLead.isHeading && !outputLead.isHeading) return true;
  if (inputLead.wholeBold && !outputLead.wholeBold && !outputLead.isHeading) return true;
  return false;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Strip scripts and dangerous attributes — lightweight server-safe sanitizer */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

export function buildFormattedUserMessage(text: string, html?: string): string {
  if (html && hasRichFormatting(html)) {
    return `INPUT_HTML (preserve all tags in output):\n${sanitizeHtml(html)}`;
  }
  return text;
}

export function getFormattedJsonSchema(hasHtml: boolean): string {
  if (hasHtml) {
    return `Return ONLY valid JSON:
{
  "resultHtml": string (full output as HTML with preserved h1-h6, p, strong, em, lists, links),
  "result": string (plain text version),
  "summary": string (one sentence on what changed)
}`;
  }
  return `Return ONLY valid JSON:
{
  "result": string (full output text),
  "summary": string (one sentence on what changed)
}`;
}

export function resolveFormattedAIResult(
  parsed: { result?: string; resultHtml?: string; summary?: string },
  inputHtml?: string
): { result: string; resultHtml?: string; summary?: string; format: "html" | "plain" } {
  const summary = parsed.summary?.trim();
  if (inputHtml && hasRichFormatting(inputHtml)) {
    const plainResult = (parsed.result ?? "").trim();
    let rawHtml = (parsed.resultHtml ?? "").trim();

    if (!rawHtml && plainResult && isHtmlResult(plainResult)) {
      rawHtml = plainResult;
    }

    if (!rawHtml || structureWasLost(inputHtml, rawHtml)) {
      const sourceText = plainResult || htmlToPlainText(rawHtml);
      rawHtml = reapplyHtmlStructure(inputHtml, sourceText);
    }

    const resultHtml = sanitizeHtml(rawHtml);
    return {
      result: resultHtml ? htmlToPlainText(resultHtml) : plainResult,
      resultHtml: resultHtml || undefined,
      summary,
      format: resultHtml ? "html" : "plain",
    };
  }
  return {
    result: (parsed.result ?? parsed.resultHtml ?? "").trim(),
    summary,
    format: "plain",
  };
}

export function buildToolRequestPayload(
  plainText: string,
  html: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    text: plainText,
    ...(hasRichFormatting(html) ? { html: sanitizeHtml(html) } : {}),
    ...extra,
  };
}

export function isHtmlResult(value: string): boolean {
  return /<(?:h[1-6]|p|strong|b|em|ul|ol|li|a)\b/i.test(value);
}
