import type { Template } from "@/types/database";
import { execute, newId, parseJson, query, queryOne, toBool, toJson, type QueryParam } from "./connection";

type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  prompt: string;
  fields: unknown;
  is_premium: number | boolean;
  is_active: number | boolean;
  created_at: Date;
  updated_at: Date;
};

function mapTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    prompt: row.prompt,
    fields: parseJson<unknown[]>(row.fields, []),
    isPremium: toBool(row.is_premium),
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateTemplateInput = {
  slug: string;
  name: string;
  description?: string | null;
  category: string;
  prompt: string;
  fields?: unknown[];
  isPremium?: boolean;
  isActive?: boolean;
};

export async function findTemplateById(id: string): Promise<Template | null> {
  const row = await queryOne<TemplateRow>("SELECT * FROM templates WHERE id = ?", [id]);
  return row ? mapTemplate(row) : null;
}

export async function findTemplateBySlug(slug: string): Promise<Template | null> {
  const row = await queryOne<TemplateRow>("SELECT * FROM templates WHERE slug = ?", [slug]);
  return row ? mapTemplate(row) : null;
}

export async function listTemplates(options?: {
  activeOnly?: boolean;
  category?: string;
}): Promise<Template[]> {
  const conditions: string[] = [];
  const params: QueryParam[] = [];

  if (options?.activeOnly !== false) {
    conditions.push("is_active = 1");
  }
  if (options?.category) {
    conditions.push("category = ?");
    params.push(options.category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query<TemplateRow>(
    `SELECT * FROM templates ${where} ORDER BY category ASC, name ASC`,
    params
  );
  return rows.map(mapTemplate);
}

export async function createTemplate(data: CreateTemplateInput): Promise<Template> {
  const id = newId();
  await execute(
    `INSERT INTO templates (id, slug, name, description, category, prompt, fields, is_premium, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.slug,
      data.name,
      data.description ?? null,
      data.category,
      data.prompt,
      toJson(data.fields ?? []),
      data.isPremium ? 1 : 0,
      data.isActive !== false ? 1 : 0,
    ]
  );
  const template = await findTemplateById(id);
  if (!template) throw new Error("Failed to create template");
  return template;
}

export async function upsertTemplateBySlug(
  slug: string,
  data: Omit<CreateTemplateInput, "slug">
): Promise<Template> {
  const existing = await findTemplateBySlug(slug);
  if (existing) {
    await execute(
      `UPDATE templates SET name = ?, description = ?, category = ?, prompt = ?,
        fields = ?, is_premium = ?, is_active = ? WHERE slug = ?`,
      [
        data.name,
        data.description ?? null,
        data.category,
        data.prompt,
        toJson(data.fields ?? []),
        data.isPremium ? 1 : 0,
        data.isActive !== false ? 1 : 0,
        slug,
      ]
    );
    const template = await findTemplateBySlug(slug);
    if (!template) throw new Error("Failed to update template");
    return template;
  }
  return createTemplate({ slug, ...data });
}
