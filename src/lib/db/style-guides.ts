import type { EnglishVariant, StyleGuide } from "@/types/database";
import { execute, newId, parseJson, query, queryOne, toJson, type QueryParam } from "./connection";

type StyleGuideRow = {
  id: string;
  name: string;
  english_variant: EnglishVariant;
  forbidden_words: unknown;
  preferred_words: unknown;
  capitalization_rules: string | null;
  tone_rules: string | null;
  sentence_length_pref: string | null;
  reading_level: string | null;
  compliance_rules: string | null;
  industry_rules: string | null;
  user_id: string;
  workspace_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export function mapStyleGuide(row: StyleGuideRow): StyleGuide {
  return {
    id: row.id,
    name: row.name,
    englishVariant: row.english_variant,
    forbiddenWords: parseJson<string[]>(row.forbidden_words, []),
    preferredWords: parseJson<string[]>(row.preferred_words, []),
    capitalizationRules: row.capitalization_rules,
    toneRules: row.tone_rules,
    sentenceLengthPref: row.sentence_length_pref,
    readingLevel: row.reading_level,
    complianceRules: row.compliance_rules,
    industryRules: row.industry_rules,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateStyleGuideInput = {
  name?: string;
  englishVariant?: EnglishVariant;
  forbiddenWords?: string[];
  preferredWords?: string[];
  capitalizationRules?: string | null;
  toneRules?: string | null;
  sentenceLengthPref?: string | null;
  readingLevel?: string | null;
  complianceRules?: string | null;
  industryRules?: string | null;
  userId: string;
  workspaceId?: string | null;
};

export type UpdateStyleGuideInput = Partial<
  Omit<StyleGuide, "id" | "userId" | "createdAt" | "updatedAt">
>;

export async function findStyleGuideById(id: string): Promise<StyleGuide | null> {
  const row = await queryOne<StyleGuideRow>("SELECT * FROM style_guides WHERE id = ?", [id]);
  return row ? mapStyleGuide(row) : null;
}

export async function findStyleGuideByIdAndUserId(
  id: string,
  userId: string
): Promise<StyleGuide | null> {
  const row = await queryOne<StyleGuideRow>(
    "SELECT * FROM style_guides WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return row ? mapStyleGuide(row) : null;
}

export async function findFirstStyleGuideByUserId(
  userId: string,
  id?: string
): Promise<StyleGuide | null> {
  if (id) {
    return findStyleGuideByIdAndUserId(id, userId);
  }
  const row = await queryOne<StyleGuideRow>(
    "SELECT * FROM style_guides WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
    [userId]
  );
  return row ? mapStyleGuide(row) : null;
}

export async function listStyleGuidesByUserId(userId: string): Promise<StyleGuide[]> {
  const rows = await query<StyleGuideRow>(
    "SELECT * FROM style_guides WHERE user_id = ? ORDER BY updated_at DESC",
    [userId]
  );
  return rows.map(mapStyleGuide);
}

export async function createStyleGuide(data: CreateStyleGuideInput): Promise<StyleGuide> {
  const id = newId();
  await execute(
    `INSERT INTO style_guides (
      id, name, english_variant, forbidden_words, preferred_words,
      capitalization_rules, tone_rules, sentence_length_pref, reading_level,
      compliance_rules, industry_rules, user_id, workspace_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name ?? "Default Style Guide",
      data.englishVariant ?? "US",
      toJson(data.forbiddenWords ?? []),
      toJson(data.preferredWords ?? []),
      data.capitalizationRules ?? null,
      data.toneRules ?? null,
      data.sentenceLengthPref ?? null,
      data.readingLevel ?? null,
      data.complianceRules ?? null,
      data.industryRules ?? null,
      data.userId,
      data.workspaceId ?? null,
    ]
  );
  const guide = await findStyleGuideById(id);
  if (!guide) throw new Error("Failed to create style guide");
  return guide;
}

export async function updateStyleGuide(
  id: string,
  data: UpdateStyleGuideInput
): Promise<StyleGuide> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.englishVariant !== undefined) {
    fields.push("english_variant = ?");
    values.push(data.englishVariant);
  }
  if (data.forbiddenWords !== undefined) {
    fields.push("forbidden_words = ?");
    values.push(toJson(data.forbiddenWords));
  }
  if (data.preferredWords !== undefined) {
    fields.push("preferred_words = ?");
    values.push(toJson(data.preferredWords));
  }
  if (data.capitalizationRules !== undefined) {
    fields.push("capitalization_rules = ?");
    values.push(data.capitalizationRules);
  }
  if (data.toneRules !== undefined) {
    fields.push("tone_rules = ?");
    values.push(data.toneRules);
  }
  if (data.sentenceLengthPref !== undefined) {
    fields.push("sentence_length_pref = ?");
    values.push(data.sentenceLengthPref);
  }
  if (data.readingLevel !== undefined) {
    fields.push("reading_level = ?");
    values.push(data.readingLevel);
  }
  if (data.complianceRules !== undefined) {
    fields.push("compliance_rules = ?");
    values.push(data.complianceRules);
  }
  if (data.industryRules !== undefined) {
    fields.push("industry_rules = ?");
    values.push(data.industryRules);
  }
  if (data.workspaceId !== undefined) {
    fields.push("workspace_id = ?");
    values.push(data.workspaceId);
  }

  if (fields.length > 0) {
    values.push(id);
    await execute(`UPDATE style_guides SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const guide = await findStyleGuideById(id);
  if (!guide) throw new Error("Style guide not found");
  return guide;
}

export async function deleteStyleGuide(id: string): Promise<void> {
  await execute("DELETE FROM style_guides WHERE id = ?", [id]);
}
