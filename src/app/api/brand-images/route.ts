import {
  findDocumentsByUserId,
  listBrandImagesByUserId,
  listBrandVoicesByUserId,
} from "@/lib/db";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkBrandImageGenerationAllowed } from "@/lib/usage";
import { isBrandImageConfigured } from "@/providers/ai/brand-image-service";

export async function GET() {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;

    const limits = await checkBrandImageGenerationAllowed(auth.session.user.id);

    const images = await listBrandImagesByUserId(auth.session.user.id, { limit: 24 });

    const brandVoices = await listBrandVoicesByUserId(auth.session.user.id);

    const documents = await findDocumentsByUserId(auth.session.user.id, "summary");

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
