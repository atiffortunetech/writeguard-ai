import { NextRequest } from "next/server";
import { findBrandImageByIdAndUserId } from "@/lib/db";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { readBrandImage } from "@/lib/brand-image-storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;

  const image = await findBrandImageByIdAndUserId(id, auth.session.user.id);

  if (!image) return apiError("Not found", 404);

  if (image.imageUrl.startsWith("http")) {
    return Response.redirect(image.imageUrl);
  }

  const local = await readBrandImage(auth.session.user.id, id, {
    storagePath: image.storagePath,
  });
  if (!local) return apiError("Image file not found", 404);

  return new Response(new Uint8Array(local.buffer), {
    headers: {
      "Content-Type": local.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
