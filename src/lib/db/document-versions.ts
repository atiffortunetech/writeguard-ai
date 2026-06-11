import type { DocumentVersion } from "@/types/database";
import { execute, newId, query, queryOne } from "./connection";

type DocumentVersionRow = {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  plain_text: string;
  version: number;
  created_at: Date;
};

function mapDocumentVersion(row: DocumentVersionRow): DocumentVersion {
  return {
    id: row.id,
    documentId: row.document_id,
    userId: row.user_id,
    content: row.content,
    plainText: row.plain_text,
    version: row.version,
    createdAt: row.created_at,
  };
}

export type CreateDocumentVersionInput = {
  documentId: string;
  userId: string;
  content: string;
  plainText: string;
  version: number;
};

export async function createVersion(data: CreateDocumentVersionInput): Promise<DocumentVersion> {
  const id = newId();
  await execute(
    `INSERT INTO document_versions (id, document_id, user_id, content, plain_text, version)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.documentId, data.userId, data.content, data.plainText, data.version]
  );
  const version = await queryOne<DocumentVersionRow>(
    "SELECT * FROM document_versions WHERE id = ?",
    [id]
  );
  if (!version) throw new Error("Failed to create document version");
  return mapDocumentVersion(version);
}

export async function listVersions(documentId: string): Promise<DocumentVersion[]> {
  const rows = await query<DocumentVersionRow>(
    "SELECT * FROM document_versions WHERE document_id = ? ORDER BY version DESC",
    [documentId]
  );
  return rows.map(mapDocumentVersion);
}

export async function countVersions(documentId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM document_versions WHERE document_id = ?",
    [documentId]
  );
  return Number(row?.count ?? 0);
}
