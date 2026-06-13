import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getBrandImageBlob,
  upsertBrandImageBlob,
  type BrandImageBlobKind,
} from "@/lib/db/brand-image-blobs";

const BUCKET = "brand-images";

function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

function canUseLocalStorage(): boolean {
  return !isVercel();
}

async function saveToDatabase(
  imageId: string,
  buffer: Buffer,
  mimeType: string,
  kind: BrandImageBlobKind,
  apiSuffix: string
): Promise<{ imageUrl: string; storagePath: string }> {
  await upsertBrandImageBlob(imageId, kind, buffer, mimeType);
  return {
    imageUrl: `/api/brand-images/${imageId}/image${apiSuffix}`,
    storagePath: kind === "ref" ? "db:ref" : "db:main",
  };
}

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
  const apiSuffix = suffix === "-ref" ? "/reference" : "";
  const kind: BrandImageBlobKind = suffix === "-ref" ? "ref" : "main";

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
    console.warn("Supabase upload failed, using database storage:", error.message);
  }

  try {
    return await saveToDatabase(imageId, buffer, mimeType, kind, apiSuffix);
  } catch (err) {
    if (!canUseLocalStorage()) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("brand_image_blobs")) {
        throw new Error(
          "Brand image storage table missing. Run mysql/brand-image-blob-migration.sql on your database."
        );
      }
      throw err;
    }
    console.warn("Database blob save failed, using local storage:", err);
  }

  const localDir = path.join(process.cwd(), ".data", BUCKET, userId);
  await mkdir(localDir, { recursive: true });
  const filePath = path.join(localDir, fileName);
  await writeFile(filePath, buffer);

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

export async function readBrandImage(
  userId: string,
  imageId: string,
  options?: { reference?: boolean; storagePath?: string | null }
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const reference = options?.reference ?? false;
  const storagePath = options?.storagePath;

  if (!storagePath?.startsWith("local:")) {
    const kind: BrandImageBlobKind =
      reference || storagePath === "db:ref" ? "ref" : "main";
    const blob = await getBrandImageBlob(imageId, kind);
    if (blob) return blob;
  }

  if (canUseLocalStorage() || storagePath?.startsWith("local:")) {
    return readLocalBrandImage(userId, imageId, reference);
  }

  return null;
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
