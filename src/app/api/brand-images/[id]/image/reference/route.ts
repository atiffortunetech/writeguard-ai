import { NextRequest } from "next/server";
import { findBrandImageByIdAndUserId } from "@/lib/db";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { readLocalBrandImage } from "@/lib/brand-image-storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;

  const image = await findBrandImageByIdAndUserId(id, auth.session.user.id);

  if (!image?.referenceImageUrl) return apiError("Reference image not found", 404);

  if (image.referenceImageUrl.startsWith("http")) {
    return Response.redirect(image.referenceImageUrl);
  }

  const local = await readLocalBrandImage(auth.session.user.id, id, true);
  if (!local) return apiError("Reference file not found", 404);

  return new Response(new Uint8Array(local.buffer), {
    headers: {
      "Content-Type": local.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
