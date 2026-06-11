import type { BrandVoice } from "@/types/database";
import { execute, newId, parseJson, query, queryOne, toBool, toJson, type QueryParam } from "./connection";

type BrandVoiceRow = {
  id: string;
  name: string;
  brand_name: string | null;
  target_audience: string | null;
  tone: string | null;
  words_to_use: unknown;
  words_to_avoid: unknown;
  writing_style: string | null;
  example_content: string | null;
  personality: string | null;
  industry: string | null;
  content_goals: string | null;
  user_id: string;
  workspace_id: string | null;
  is_default: number | boolean;
  created_at: Date;
  updated_at: Date;
};

export function mapBrandVoice(row: BrandVoiceRow): BrandVoice {
  return {
    id: row.id,
    name: row.name,
    brandName: row.brand_name,
    targetAudience: row.target_audience,
    tone: row.tone,
    wordsToUse: parseJson<string[]>(row.words_to_use, []),
    wordsToAvoid: parseJson<string[]>(row.words_to_avoid, []),
    writingStyle: row.writing_style,
    exampleContent: row.example_content,
    personality: row.personality,
    industry: row.industry,
    contentGoals: row.content_goals,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    isDefault: toBool(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateBrandVoiceInput = Omit<
  BrandVoice,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export type UpdateBrandVoiceInput = Partial<
  Omit<BrandVoice, "id" | "userId" | "createdAt" | "updatedAt">
>;

export async function findBrandVoiceById(id: string): Promise<BrandVoice | null> {
  const row = await queryOne<BrandVoiceRow>("SELECT * FROM brand_voices WHERE id = ?", [id]);
  return row ? mapBrandVoice(row) : null;
}

export async function findBrandVoiceByIdAndUserId(
  id: string,
  userId: string
): Promise<BrandVoice | null> {
  const row = await queryOne<BrandVoiceRow>(
    "SELECT * FROM brand_voices WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return row ? mapBrandVoice(row) : null;
}

export async function findFirstBrandVoiceByUserId(
  userId: string,
  id?: string
): Promise<BrandVoice | null> {
  if (id) {
    return findBrandVoiceByIdAndUserId(id, userId);
  }
  const row = await queryOne<BrandVoiceRow>(
    "SELECT * FROM brand_voices WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC LIMIT 1",
    [userId]
  );
  return row ? mapBrandVoice(row) : null;
}

export async function listBrandVoicesByUserId(userId: string): Promise<BrandVoice[]> {
  const rows = await query<BrandVoiceRow>(
    "SELECT * FROM brand_voices WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC",
    [userId]
  );
  return rows.map(mapBrandVoice);
}

export async function countBrandVoicesByUserId(userId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM brand_voices WHERE user_id = ?",
    [userId]
  );
  return Number(row?.count ?? 0);
}

export async function clearDefaultBrandVoices(userId: string): Promise<void> {
  await execute("UPDATE brand_voices SET is_default = 0 WHERE user_id = ?", [userId]);
}

export async function createBrandVoice(
  data: Omit<CreateBrandVoiceInput, "createdAt" | "updatedAt">
): Promise<BrandVoice> {
  const id = data.id ?? newId();
  await execute(
    `INSERT INTO brand_voices (
      id, name, brand_name, target_audience, tone, words_to_use, words_to_avoid,
      writing_style, example_content, personality, industry, content_goals,
      user_id, workspace_id, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.brandName ?? null,
      data.targetAudience ?? null,
      data.tone ?? null,
      toJson(data.wordsToUse ?? []),
      toJson(data.wordsToAvoid ?? []),
      data.writingStyle ?? null,
      data.exampleContent ?? null,
      data.personality ?? null,
      data.industry ?? null,
      data.contentGoals ?? null,
      data.userId,
      data.workspaceId ?? null,
      data.isDefault ? 1 : 0,
    ]
  );
  const bv = await findBrandVoiceById(id);
  if (!bv) throw new Error("Failed to create brand voice");
  return bv;
}

export async function updateBrandVoice(
  id: string,
  data: UpdateBrandVoiceInput
): Promise<BrandVoice> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  const map: Array<[keyof UpdateBrandVoiceInput, string]> = [
    ["name", "name"],
    ["brandName", "brand_name"],
    ["targetAudience", "target_audience"],
    ["tone", "tone"],
    ["writingStyle", "writing_style"],
    ["exampleContent", "example_content"],
    ["personality", "personality"],
    ["industry", "industry"],
    ["contentGoals", "content_goals"],
    ["workspaceId", "workspace_id"],
  ];

  for (const [key, col] of map) {
    if (data[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(data[key] as import("./connection").QueryParam);
    }
  }
  if (data.wordsToUse !== undefined) {
    fields.push("words_to_use = ?");
    values.push(toJson(data.wordsToUse));
  }
  if (data.wordsToAvoid !== undefined) {
    fields.push("words_to_avoid = ?");
    values.push(toJson(data.wordsToAvoid));
  }
  if (data.isDefault !== undefined) {
    fields.push("is_default = ?");
    values.push(data.isDefault ? 1 : 0);
  }

  if (fields.length > 0) {
    values.push(id);
    await execute(`UPDATE brand_voices SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const bv = await findBrandVoiceById(id);
  if (!bv) throw new Error("Brand voice not found");
  return bv;
}

export async function deleteBrandVoice(id: string): Promise<void> {
  await execute("DELETE FROM brand_voices WHERE id = ?", [id]);
}
