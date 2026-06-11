import type { Document } from "@/types/database";
import { execute, newId, query, queryOne, toBool, type QueryParam } from "./connection";

type DocumentRow = {
  id: string;
  title: string;
  content: string;
  plain_text: string;
  user_id: string;
  workspace_id: string | null;
  folder_id: string | null;
  brand_voice_id: string | null;
  style_guide_id: string | null;
  is_confidential: number | boolean;
  word_count: number;
  character_count: number;
  created_at: Date;
  updated_at: Date;
};

export function mapDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    plainText: row.plain_text,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    folderId: row.folder_id,
    brandVoiceId: row.brand_voice_id,
    styleGuideId: row.style_guide_id,
    isConfidential: toBool(row.is_confidential),
    wordCount: row.word_count,
    characterCount: row.character_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateDocumentInput = {
  title?: string;
  content?: string;
  plainText?: string;
  userId: string;
  workspaceId?: string | null;
  folderId?: string | null;
  brandVoiceId?: string | null;
  styleGuideId?: string | null;
  isConfidential?: boolean;
  wordCount?: number;
  characterCount?: number;
};

export type UpdateDocumentInput = Partial<{
  title: string;
  content: string;
  plainText: string;
  workspaceId: string | null;
  folderId: string | null;
  brandVoiceId: string | null;
  styleGuideId: string | null;
  isConfidential: boolean;
  wordCount: number;
  characterCount: number;
}>;

export async function findDocumentById(id: string): Promise<Document | null> {
  const row = await queryOne<DocumentRow>("SELECT * FROM documents WHERE id = ?", [id]);
  return row ? mapDocument(row) : null;
}

export async function findDocumentByIdAndUserId(
  id: string,
  userId: string
): Promise<Document | null> {
  const row = await queryOne<DocumentRow>(
    "SELECT * FROM documents WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return row ? mapDocument(row) : null;
}

export type DocumentListItem = Pick<
  Document,
  "id" | "title" | "wordCount" | "updatedAt" | "createdAt"
>;

export async function findDocuments(
  userId: string,
  options?: { limit?: number; orderBy?: "updated_at" | "created_at" }
): Promise<DocumentListItem[]> {
  const limit = options?.limit ?? 50;
  const orderBy = options?.orderBy ?? "updated_at";
  const rows = await query<DocumentRow>(
    `SELECT id, title, word_count, updated_at, created_at FROM documents
     WHERE user_id = ? ORDER BY ${orderBy} DESC LIMIT ?`,
    [userId, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    wordCount: row.word_count,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  }));
}

export async function findDocumentsByUserId(
  userId: string,
  select?: "full" | "summary"
): Promise<Document[] | DocumentListItem[]> {
  if (select === "summary") {
    return findDocuments(userId);
  }
  const rows = await query<DocumentRow>(
    "SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC",
    [userId]
  );
  return rows.map(mapDocument);
}

export async function createDocument(data: CreateDocumentInput): Promise<Document> {
  const id = newId();
  await execute(
    `INSERT INTO documents (
      id, title, content, plain_text, user_id, workspace_id, folder_id,
      brand_voice_id, style_guide_id, is_confidential, word_count, character_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title ?? "Untitled Document",
      data.content ?? "",
      data.plainText ?? data.content ?? "",
      data.userId,
      data.workspaceId ?? null,
      data.folderId ?? null,
      data.brandVoiceId ?? null,
      data.styleGuideId ?? null,
      data.isConfidential ? 1 : 0,
      data.wordCount ?? 0,
      data.characterCount ?? 0,
    ]
  );
  const doc = await findDocumentById(id);
  if (!doc) throw new Error("Failed to create document");
  return doc;
}

export async function updateDocument(
  id: string,
  data: UpdateDocumentInput
): Promise<Document> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.content !== undefined) {
    fields.push("content = ?");
    values.push(data.content);
  }
  if (data.plainText !== undefined) {
    fields.push("plain_text = ?");
    values.push(data.plainText);
  }
  if (data.workspaceId !== undefined) {
    fields.push("workspace_id = ?");
    values.push(data.workspaceId);
  }
  if (data.folderId !== undefined) {
    fields.push("folder_id = ?");
    values.push(data.folderId);
  }
  if (data.brandVoiceId !== undefined) {
    fields.push("brand_voice_id = ?");
    values.push(data.brandVoiceId);
  }
  if (data.styleGuideId !== undefined) {
    fields.push("style_guide_id = ?");
    values.push(data.styleGuideId);
  }
  if (data.isConfidential !== undefined) {
    fields.push("is_confidential = ?");
    values.push(data.isConfidential ? 1 : 0);
  }
  if (data.wordCount !== undefined) {
    fields.push("word_count = ?");
    values.push(data.wordCount);
  }
  if (data.characterCount !== undefined) {
    fields.push("character_count = ?");
    values.push(data.characterCount);
  }

  if (fields.length > 0) {
    values.push(id);
    await execute(`UPDATE documents SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const doc = await findDocumentById(id);
  if (!doc) throw new Error("Document not found");
  return doc;
}

export async function deleteDocument(id: string): Promise<void> {
  await execute("DELETE FROM documents WHERE id = ?", [id]);
}

export async function countDocuments(userId?: string): Promise<number> {
  if (userId) {
    const row = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM documents WHERE user_id = ?",
      [userId]
    );
    return Number(row?.count ?? 0);
  }
  const row = await queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM documents");
  return Number(row?.count ?? 0);
}
