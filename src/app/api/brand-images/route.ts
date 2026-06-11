import { prisma } from "@/lib/prisma";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkBrandImageGenerationAllowed } from "@/lib/usage";
import { isBrandImageConfigured } from "@/providers/ai/brand-image-service";

export async function GET() {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;

    const limits = await checkBrandImageGenerationAllowed(auth.session.user.id);

    const images = await prisma.brandImage.findMany({
      where: { userId: auth.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        imagePrompt: true,
        colors: true,
        stylePreset: true,
        aspectRatio: true,
        sourceType: true,
        referenceImageUrl: true,
        createdAt: true,
      },
    });

    const brandVoices = await prisma.brandVoice.findMany({
      where: { userId: auth.session.user.id },
      select: { id: true, name: true, tone: true },
      orderBy: { updatedAt: "desc" },
    });

    const documents = await prisma.document.findMany({
      where: { userId: auth.session.user.id },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return Response.json({
      configured: isBrandImageConfigured(),
      images,
      brandVoices,
      documents,
      creditCost: limits.creditCost,
      imagesRemaining: limits.imagesRemaining,
    });
  } catch (err) {
    console.error("GET /api/brand-images error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to load Brand Image Studio";
    if (message.includes("BrandImage") || message.includes("does not exist")) {
      return apiError(
        "BrandImage table missing. Run: node scripts/ensure-brand-image-db.mjs then restart dev server.",
        503
      );
    }
    return apiError(message, 500);
  }
}
