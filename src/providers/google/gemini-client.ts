const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiTextModel(): string {
  return process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
}

export function getGeminiImageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
}

export interface GeminiContentPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiContentPart[];
    };
  }>;
  error?: { message?: string };
}

export async function geminiGenerateContent(
  model: string,
  parts: GeminiContentPart[],
  options?: {
    responseModalities?: ("TEXT" | "IMAGE")[];
    aspectRatio?: string;
  }
): Promise<GeminiGenerateResponse> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.7,
    },
  };

  if (options?.responseModalities?.length) {
    body.generationConfig = {
      ...(body.generationConfig as object),
      responseModalities: options.responseModalities,
    };
    if (options.aspectRatio) {
      body.generationConfig = {
        ...(body.generationConfig as object),
        imageConfig: { aspectRatio: options.aspectRatio },
      };
    }
  }

  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as GeminiGenerateResponse;
  if (!res.ok) {
    const raw = data.error?.message || `Gemini API error (${res.status})`;
    throw new Error(formatGeminiError(raw));
  }
  return data;
}

/** Turn Google's quota/billing errors into plain language. */
function formatGeminiError(message: string): string {
  if (message.includes("not found for API version") || message.includes("not supported for generateContent")) {
    return `Gemini model unavailable: ${message.split(". Call")[0]}. Update GEMINI_IMAGE_MODEL in .env to a supported model (e.g. gemini-2.5-flash-image).`;
  }
  if (message.includes("limit: 0")) {
    return (
      "Your Google Gemini API key has no free quota for this model (limit is 0 — not because you used it up). " +
      "Create a new key at https://aistudio.google.com/apikey or enable billing in Google AI Studio, then update GEMINI_API_KEY in .env and restart the dev server."
    );
  }
  if (message.includes("quota") || message.includes("billing")) {
    return (
      "Google Gemini quota or billing limit reached for this model. " +
      "Check usage at https://ai.dev/rate-limit or enable billing at https://aistudio.google.com/apikey"
    );
  }
  return message;
}

export function extractTextFromResponse(data: GeminiGenerateResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p) => p.text)
    .map((p) => p.text!)
    .join("");
}

export function extractImageFromResponse(
  data: GeminiGenerateResponse
): { mimeType: string; base64: string } | null {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        mimeType: part.inlineData.mimeType || "image/png",
        base64: part.inlineData.data,
      };
    }
  }
  return null;
}
