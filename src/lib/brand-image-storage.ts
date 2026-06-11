import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase";

const BUCKET = "brand-images";

export async function saveBrandImageFile(
  userId: string,
  imageId: string,
  buffer: Buffer,
  mimeType: string,
  suffix = ""
): Promise<{ imageUrl: string; storagePath: string | null }> {
  const ext = mimeType.includes("jpeg") ? "jpg" : mimeType.includes("webp") ? "webp" : "png";
  const fileName = suffix ? `${imageId}${suffix}.${ext}` : `${imageId}.${ext}`;
  const storagePath = `${userId}/${fileName}`;

  const admin = getSupabaseAdmin();
  if (admin) {
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error) {
      const { data } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
      return { imageUrl: data.publicUrl, storagePath };
    }
    console.warn("Supabase upload failed, using local storage:", error.message);
  }

  const localDir = path.join(process.cwd(), ".data", BUCKET, userId);
  await mkdir(localDir, { recursive: true });
  const filePath = path.join(localDir, fileName);
  await writeFile(filePath, buffer);

  const apiSuffix = suffix === "-ref" ? "/reference" : "";
  return {
    imageUrl: `/api/brand-images/${imageId}/image${apiSuffix}`,
    storagePath: `local:${filePath}`,
  };
}

export async function saveBrandReferenceFile(
  userId: string,
  imageId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ imageUrl: string; storagePath: string | null }> {
  return saveBrandImageFile(userId, imageId, buffer, mimeType, "-ref");
}

export async function readLocalBrandImage(
  userId: string,
  imageId: string,
  reference = false
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const localDir = path.join(process.cwd(), ".data", BUCKET, userId);
  const suffix = reference ? "-ref" : "";
  for (const ext of ["png", "jpg", "webp"]) {
    try {
      const filePath = path.join(localDir, `${imageId}${suffix}.${ext}`);
      const buffer = await readFile(filePath);
      return {
        buffer,
        mimeType:
          ext === "jpg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png",
      };
    } catch {
      // try next extension
    }
  }
  return null;
}
