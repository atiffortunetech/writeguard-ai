import OpenAI, { toFile } from "openai";
import {
  BRAND_IMAGE_PROMPT_SYSTEM,
  buildBrandImagePromptRequest,
  STYLE_PRESETS,
  type BrandImagePromptInput,
} from "@/prompts/brand-image";

export interface BrandImagePromptResult {
  title: string;
  imagePrompt: string;
  summary: string;
}

export interface BrandImageReferenceInput {
  buffer: Buffer;
  mimeType: string;
}

const FALLBACK_IMAGE_MODELS = ["gpt-image-1", "dall-e-3", "dall-e-2"];

type OpenAIImageSize =
  | "1024x1024"
  | "1536x1024"
  | "1024x1536"
  | "1792x1024"
  | "1024x1792";

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

export function getBrandImageTextModel(): string {
  return (
    process.env.OPENAI_BRAND_IMAGE_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4o-mini"
  );
}

export function getBrandImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
}

export function isBrandImageConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function aspectToOpenAISize(aspectRatio: string, model: string): OpenAIImageSize {
  const gptImage = model.startsWith("gpt-image");
  switch (aspectRatio) {
    case "16:9":
    case "4:3":
      return gptImage ? "1536x1024" : "1792x1024";
    case "9:16":
      return gptImage ? "1024x1536" : "1024x1792";
    default:
      return "1024x1024";
  }
}

function referenceFileName(mimeType: string): string {
  if (mimeType.includes("jpeg")) return "reference.jpg";
  if (mimeType.includes("webp")) return "reference.webp";
  return "reference.png";
}

export async function analyzeReferenceImage(
  reference: BrandImageReferenceInput
): Promise<string> {
  const client = getOpenAIClient();
  const dataUrl = `data:${reference.mimeType};base64,${reference.buffer.toString("base64")}`;

  const response = await client.chat.completions.create({
    model: getBrandImageTextModel(),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this reference image for a marketing image generator. Describe in 4-6 sentences:
- Subject matter and key objects
- Composition and layout (centered, rule of thirds, etc.)
- Lighting, color palette, and mood
- Art style (photo, illustration, 3D, flat, etc.)
- What should be preserved when creating a similar on-brand variant

Be specific and practical. Do not invent brand names from the image.`,
          },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 400,
  });

  return (
    response.choices[0]?.message?.content?.trim() ||
    "Match the reference image composition, style, and mood."
  );
}

export async function buildBrandImagePrompt(
  input: BrandImagePromptInput
): Promise<BrandImagePromptResult> {
  const styleHint = STYLE_PRESETS[input.stylePreset] ?? input.stylePreset;
  const userMessage = buildBrandImagePromptRequest(input);
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: getBrandImageTextModel(),
    messages: [
      {
        role: "system",
        content: `${BRAND_IMAGE_PROMPT_SYSTEM}\n\nStyle direction: ${styleHint}`,
      },
      { role: "user", content: userMessage },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Failed to build image prompt");
  }

  const parsed = JSON.parse(text) as BrandImagePromptResult;
  if (!parsed.imagePrompt?.trim()) {
    throw new Error("Failed to build image prompt");
  }

  return {
    title: parsed.title?.trim() || "Brand image",
    imagePrompt: parsed.imagePrompt.trim(),
    summary: parsed.summary?.trim() || "Brand marketing visual",
  };
}

async function extractImageFromResponse(
  response: OpenAI.Images.ImagesResponse
): Promise<{ mimeType: string; buffer: Buffer }> {
  const item = response.data?.[0];
  const b64 = item?.b64_json;
  if (b64) {
    return {
      mimeType: "image/png",
      buffer: Buffer.from(b64, "base64"),
    };
  }

  const url = item?.url;
  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      throw new Error("Failed to download generated image");
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const mimeType = imgRes.headers.get("content-type") || "image/png";
    return { mimeType, buffer };
  }

  throw new Error("No image in OpenAI response");
}

export async function generateBrandImage(
  imagePrompt: string,
  aspectRatio: string,
  reference?: BrandImageReferenceInput
): Promise<{ mimeType: string; buffer: Buffer }> {
  const client = getOpenAIClient();
  const configuredModel = getBrandImageModel();
  const modelsToTry = [
    configuredModel,
    ...FALLBACK_IMAGE_MODELS.filter((m) => m !== configuredModel),
  ];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const size = aspectToOpenAISize(aspectRatio, model);

      if (reference && model.startsWith("gpt-image")) {
        const file = await toFile(
          reference.buffer,
          referenceFileName(reference.mimeType),
          { type: reference.mimeType }
        );
        const editPrompt = `${imagePrompt}\n\nUse the uploaded reference image as a style and composition guide. Create a new on-brand marketing visual inspired by the reference.`;
        const response = await client.images.edit({
          model,
          image: file,
          prompt: editPrompt,
          n: 1,
          size,
        });
        return extractImageFromResponse(response);
      }

      const response = await client.images.generate({
        model,
        prompt: imagePrompt,
        n: 1,
        size,
        ...(model === "dall-e-3" ? { quality: "standard" as const } : {}),
      });
      return extractImageFromResponse(response);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Brand image model ${model} failed:`, lastError.message);
    }
  }

  throw lastError ?? new Error("Image generation failed");
}
