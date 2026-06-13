import { execute, queryOne, type QueryParam } from "./connection";

export type BrandImageBlobKind = "main" | "ref";

type BlobRow = {
  mime_type: string;
  data: Buffer;
};

export async function upsertBrandImageBlob(
  brandImageId: string,
  kind: BrandImageBlobKind,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  await execute(
    `INSERT INTO brand_image_blobs (brand_image_id, kind, mime_type, data)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE mime_type = VALUES(mime_type), data = VALUES(data)`,
    [brandImageId, kind, mimeType, buffer] as QueryParam[]
  );
}

export async function getBrandImageBlob(
  brandImageId: string,
  kind: BrandImageBlobKind
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const row = await queryOne<BlobRow>(
    "SELECT mime_type, data FROM brand_image_blobs WHERE brand_image_id = ? AND kind = ?",
    [brandImageId, kind]
  );
  if (!row?.data) return null;
  return { buffer: Buffer.from(row.data), mimeType: row.mime_type };
}
