import { NextRequest } from "next/server";
import {
  createBrandImage,
  findDocumentByIdAndUserId,
  findFirstBrandVoiceByUserId,
  updateBrandImage,
} from "@/lib/db";
import { brandImageGenerateSchema } from "@/lib/validations";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkFeatureAccess } from "@/lib/plan-features";
import {
  checkBrandImageGenerationAllowed,
  consumeBrandImageCredits,
} from "@/lib/usage";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { logActivity } from "@/lib/activity";
import {
  analyzeReferenceImage,
  buildBrandImagePrompt,
  generateBrandImage,
  getBrandImageModel,
  isBrandImageConfigured,
  type BrandImageReferenceInput,
} from "@/providers/ai/brand-image-service";
import {
  saveBrandImageFile,
  saveBrandReferenceFile,
} from "@/lib/brand-image-storage";
import { formatBrandVoiceContext } from "@/prompts/writing";
import type { BrandVoiceContext } from "@/types/ai";

function decodeReferenceImage(data: {
  base64: string;
  mimeType: string;
}): BrandImageReferenceInput {
  const raw = data.base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(raw, "base64");
  if (buffer.length === 0 || buffer.length > 4 * 1024 * 1024) {
    throw new Error("Reference image must be between 1 byte and 4 MB");
  }
  return { buffer, mimeType: data.mimeType };
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const rate = await checkRateLimit(auth.session.user.id, aiRateLimiter);
  if (!rate.success) return apiError("Rate limit exceeded", 429);

  const access = await checkFeatureAccess(auth.session.user.id, "brand-images");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const limits = await checkBrandImageGenerationAllowed(auth.session.user.id);
  if (!limits.allowed) return apiError(limits.reason ?? "Limit reached", 403);

  if (!isBrandImageConfigured()) {
    return apiError("OPENAI_API_KEY is not configured on the server.", 503);
  }

  const body = await req.json();
  const parsed = brandImageGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const data = parsed.data;
  let sourceText = data.sourceText.trim();

  if (data.documentId) {
    const doc = await findDocumentByIdAndUserId(data.documentId, auth.session.user.id);
    if (!doc) return apiError("Document not found", 404);
    sourceText = doc.plainText || doc.content.replace(/<[^>]+>/g, " ").slice(0, 8000);
  }

  let brandVoiceContext: string | undefined;
  if (data.brandVoiceId) {
    const bv = await findFirstBrandVoiceByUserId(auth.session.user.id, data.brandVoiceId);
    if (bv) {
      brandVoiceContext = formatBrandVoiceContext(bv as BrandVoiceContext);
    }
  }

  let reference: BrandImageReferenceInput | undefined;
  if (data.referenceImage) {
    try {
      reference = decodeReferenceImage(data.referenceImage);
    } catch (err) {
      return apiError(
        err instanceof Error ? err.message : "Invalid reference image",
        400
      );
    }
  }

  try {
    let referenceImageContext: string | undefined;
    if (reference) {
      referenceImageContext = await analyzeReferenceImage(reference);
    }

    const promptInput = {
      sourceType: data.sourceType,
      sourceText,
      colors: data.colors,
      stylePreset: data.stylePreset,
      aspectRatio: data.aspectRatio,
      brandVoiceContext,
      referenceImageContext,
      ...(data.promptOverride?.trim()
        ? { promptOverride: data.promptOverride.trim() }
        : {}),
    };

    const promptResult = await buildBrandImagePrompt(promptInput);

    const { buffer, mimeType } = await generateBrandImage(
      promptResult.imagePrompt,
      data.aspectRatio,
      reference
    );

    const record = await createBrandImage({
      userId: auth.session.user.id,
      title: data.title || promptResult.title,
      sourceType: data.sourceType,
      sourceText: sourceText.slice(0, 5000),
      imagePrompt: promptResult.imagePrompt,
      colors: data.colors,
      stylePreset: data.stylePreset,
      aspectRatio: data.aspectRatio,
      imageUrl: "",
      brandVoiceId: data.brandVoiceId ?? null,
      provider: "openai",
    });

    const { imageUrl, storagePath } = await saveBrandImageFile(
      auth.session.user.id,
      record.id,
      buffer,
      mimeType
    );

    let referenceImageUrl: string | null = null;
    let referenceStoragePath: string | null = null;
    if (reference) {
      const refSaved = await saveBrandReferenceFile(
        auth.session.user.id,
        record.id,
        reference.buffer,
        reference.mimeType
      );
      referenceImageUrl = refSaved.imageUrl;
      referenceStoragePath = refSaved.storagePath;
    }

    const updated = await updateBrandImage(record.id, {
      imageUrl,
      storagePath,
      mimeType,
      referenceImageUrl,
      referenceStoragePath,
    });

    await consumeBrandImageCredits(
      auth.session.user.id,
      limits.creditCost,
      "/api/brand-images/generate",
      getBrandImageModel(),
      Date.now() - start
    );

    await logActivity({
      userId: auth.session.user.id,
      type: "BRAND_IMAGE_GENERATED",
      description: `Generated brand image: ${updated.title ?? "Untitled"}`,
    });

    return Response.json({
      id: updated.id,
      title: updated.title,
      imageUrl: updated.imageUrl,
      referenceImageUrl: updated.referenceImageUrl,
      imagePrompt: updated.imagePrompt,
      summary: promptResult.summary,
      colors: updated.colors,
      stylePreset: updated.stylePreset,
      aspectRatio: updated.aspectRatio,
      createdAt: updated.createdAt,
      imagesRemaining: limits.imagesRemaining != null ? limits.imagesRemaining - 1 : undefined,
    });
  } catch (err) {
    console.error("Brand image generation error:", err);
    return apiError(
      err instanceof Error ? err.message : "Image generation failed",
      503
    );
  }
}
