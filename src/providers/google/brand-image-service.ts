import {
  BRAND_IMAGE_PROMPT_SYSTEM,
  buildBrandImagePromptRequest,
  STYLE_PRESETS,
  type BrandImagePromptInput,
} from "@/prompts/brand-image";
import {
  geminiGenerateContent,
  getGeminiImageModel,
  getGeminiTextModel,
  extractTextFromResponse,
  extractImageFromResponse,
  isGeminiConfigured,
} from "./gemini-client";

export interface BrandImagePromptResult {
  title: string;
  imagePrompt: string;
  summary: string;
}

const FALLBACK_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image",
  "gemini-3-pro-image-preview",
];

export async function buildBrandImagePrompt(
  input: BrandImagePromptInput
): Promise<BrandImagePromptResult> {
  const styleHint = STYLE_PRESETS[input.stylePreset] ?? input.stylePreset;
  const userMessage = buildBrandImagePromptRequest(input);

  const data = await geminiGenerateContent(
    getGeminiTextModel(),
    [{ text: `${BRAND_IMAGE_PROMPT_SYSTEM}\n\nStyle direction: ${styleHint}\n\n${userMessage}` }]
  );

  const text = extractTextFromResponse(data);
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as BrandImagePromptResult;

  if (!parsed.imagePrompt?.trim()) {
    throw new Error("Failed to build image prompt");
  }

  return {
    title: parsed.title?.trim() || "Brand image",
    imagePrompt: parsed.imagePrompt.trim(),
    summary: parsed.summary?.trim() || "Brand marketing visual",
  };
}

export async function generateBrandImage(
  imagePrompt: string,
  aspectRatio: string
): Promise<{ mimeType: string; buffer: Buffer }> {
  const configuredModel = getGeminiImageModel();
  const modelsToTry = [
    configuredModel,
    ...FALLBACK_IMAGE_MODELS.filter((m) => m !== configuredModel),
  ];

  let lastError: Error | null = null;
  const failures: string[] = [];

  for (const model of modelsToTry) {
    try {
      const data = await geminiGenerateContent(
        model,
        [{ text: imagePrompt }],
        {
          responseModalities: ["TEXT", "IMAGE"],
          aspectRatio,
        }
      );

      const image = extractImageFromResponse(data);
      if (!image) {
        throw new Error("No image in Gemini response");
      }

      return {
        mimeType: image.mimeType,
        buffer: Buffer.from(image.base64, "base64"),
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      failures.push(`${model}: ${lastError.message}`);
      console.warn(`Brand image model ${model} failed:`, lastError.message);
    }
  }

  const quotaHit = failures.some((f) => f.includes("quota") || f.includes("limit: 0"));
  if (quotaHit) {
    throw new Error(
      "Google Gemini image quota is not available on your API key (limit may be 0). " +
        "Create a new key at https://aistudio.google.com/apikey or enable billing, then restart the dev server."
    );
  }

  throw lastError ?? new Error("Image generation failed");
}

export { isGeminiConfigured };
