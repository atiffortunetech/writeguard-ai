import type { BrandImage } from "@/types/database";
import { execute, newId, parseJson, query, queryOne, toJson, type QueryParam } from "./connection";

type BrandImageRow = {
  id: string;
  user_id: string;
  title: string | null;
  source_type: string;
  source_text: string | null;
  image_prompt: string;
  colors: unknown;
  style_preset: string;
  aspect_ratio: string;
  image_url: string;
  storage_path: string | null;
  reference_image_url: string | null;
  reference_storage_path: string | null;
  mime_type: string;
  brand_voice_id: string | null;
  provider: string;
  created_at: Date;
};

export function mapBrandImage(row: BrandImageRow): BrandImage {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    sourceType: row.source_type,
    sourceText: row.source_text,
    imagePrompt: row.image_prompt,
    colors: parseJson<Record<string, unknown>>(row.colors, {}),
    stylePreset: row.style_preset,
    aspectRatio: row.aspect_ratio,
    imageUrl: row.image_url,
    storagePath: row.storage_path,
    referenceImageUrl: row.reference_image_url,
    referenceStoragePath: row.reference_storage_path,
    mimeType: row.mime_type,
    brandVoiceId: row.brand_voice_id,
    provider: row.provider,
    createdAt: row.created_at,
  };
}

export type CreateBrandImageInput = {
  userId: string;
  title?: string | null;
  sourceType?: string;
  sourceText?: string | null;
  imagePrompt: string;
  colors?: Record<string, unknown>;
  stylePreset?: string;
  aspectRatio?: string;
  imageUrl?: string;
  storagePath?: string | null;
  referenceImageUrl?: string | null;
  referenceStoragePath?: string | null;
  mimeType?: string;
  brandVoiceId?: string | null;
  provider?: string;
};

export type UpdateBrandImageInput = Partial<
  Omit<BrandImage, "id" | "userId" | "createdAt">
>;

export async function findBrandImageById(id: string): Promise<BrandImage | null> {
  const row = await queryOne<BrandImageRow>("SELECT * FROM brand_images WHERE id = ?", [id]);
  return row ? mapBrandImage(row) : null;
}

export async function findBrandImageByIdAndUserId(
  id: string,
  userId: string
): Promise<BrandImage | null> {
  const row = await queryOne<BrandImageRow>(
    "SELECT * FROM brand_images WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return row ? mapBrandImage(row) : null;
}

export async function listBrandImagesByUserId(
  userId: string,
  options?: { limit?: number }
): Promise<BrandImage[]> {
  const limit = options?.limit ?? 50;
  const rows = await query<BrandImageRow>(
    "SELECT * FROM brand_images WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit]
  );
  return rows.map(mapBrandImage);
}

export async function createBrandImage(data: CreateBrandImageInput): Promise<BrandImage> {
  const id = newId();
  await execute(
    `INSERT INTO brand_images (
      id, user_id, title, source_type, source_text, image_prompt, colors,
      style_preset, aspect_ratio, image_url, storage_path,
      reference_image_url, reference_storage_path, mime_type, brand_voice_id, provider
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.title ?? null,
      data.sourceType ?? "prompt",
      data.sourceText ?? null,
      data.imagePrompt,
      toJson(data.colors ?? {}),
      data.stylePreset ?? "social-banner",
      data.aspectRatio ?? "16:9",
      data.imageUrl ?? "",
      data.storagePath ?? null,
      data.referenceImageUrl ?? null,
      data.referenceStoragePath ?? null,
      data.mimeType ?? "image/png",
      data.brandVoiceId ?? null,
      data.provider ?? "openai",
    ]
  );
  const image = await findBrandImageById(id);
  if (!image) throw new Error("Failed to create brand image");
  return image;
}

export async function updateBrandImage(
  id: string,
  data: UpdateBrandImageInput
): Promise<BrandImage> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  const scalarMap: Array<[keyof UpdateBrandImageInput, string]> = [
    ["title", "title"],
    ["sourceType", "source_type"],
    ["sourceText", "source_text"],
    ["imagePrompt", "image_prompt"],
    ["stylePreset", "style_preset"],
    ["aspectRatio", "aspect_ratio"],
    ["imageUrl", "image_url"],
    ["storagePath", "storage_path"],
    ["referenceImageUrl", "reference_image_url"],
    ["referenceStoragePath", "reference_storage_path"],
    ["mimeType", "mime_type"],
    ["brandVoiceId", "brand_voice_id"],
    ["provider", "provider"],
  ];

  for (const [key, col] of scalarMap) {
    if (data[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(data[key] as import("./connection").QueryParam);
    }
  }
  if (data.colors !== undefined) {
    fields.push("colors = ?");
    values.push(toJson(data.colors));
  }

  if (fields.length > 0) {
    values.push(id);
    await execute(`UPDATE brand_images SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const image = await findBrandImageById(id);
  if (!image) throw new Error("Brand image not found");
  return image;
}

export async function countBrandImagesByUserId(
  userId: string,
  since?: Date
): Promise<number> {
  if (since) {
    const row = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM brand_images WHERE user_id = ? AND created_at >= ?",
      [userId, since]
    );
    return Number(row?.count ?? 0);
  }
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM brand_images WHERE user_id = ?",
    [userId]
  );
  return Number(row?.count ?? 0);
}

export async function deleteBrandImage(id: string): Promise<void> {
  await execute("DELETE FROM brand_images WHERE id = ?", [id]);
}
