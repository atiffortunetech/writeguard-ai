import type { Suggestion, SuggestionSeverity, SuggestionType } from "@/types/database";
import { execute, newId, query, queryOne, toBool } from "./connection";

type SuggestionRow = {
  id: string;
  document_id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  original_text: string;
  suggested_text: string;
  explanation: string;
  start_index: number;
  end_index: number;
  accepted: number | boolean | null;
  created_at: Date;
};

function mapSuggestion(row: SuggestionRow): Suggestion {
  return {
    id: row.id,
    documentId: row.document_id,
    type: row.type,
    severity: row.severity,
    originalText: row.original_text,
    suggestedText: row.suggested_text,
    explanation: row.explanation,
    startIndex: row.start_index,
    endIndex: row.end_index,
    accepted: row.accepted === null ? null : toBool(row.accepted),
    createdAt: row.created_at,
  };
}

export type CreateSuggestionInput = {
  documentId: string;
  type: SuggestionType;
  severity?: SuggestionSeverity;
  originalText: string;
  suggestedText: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
  accepted?: boolean | null;
};

export async function findSuggestionById(id: string): Promise<Suggestion | null> {
  const row = await queryOne<SuggestionRow>("SELECT * FROM suggestions WHERE id = ?", [id]);
  return row ? mapSuggestion(row) : null;
}

export async function listSuggestionsByDocumentId(documentId: string): Promise<Suggestion[]> {
  const rows = await query<SuggestionRow>(
    "SELECT * FROM suggestions WHERE document_id = ? ORDER BY start_index ASC",
    [documentId]
  );
  return rows.map(mapSuggestion);
}

export async function createSuggestion(data: CreateSuggestionInput): Promise<Suggestion> {
  const id = newId();
  await execute(
    `INSERT INTO suggestions (
      id, document_id, type, severity, original_text, suggested_text,
      explanation, start_index, end_index, accepted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.documentId,
      data.type,
      data.severity ?? "MEDIUM",
      data.originalText,
      data.suggestedText,
      data.explanation,
      data.startIndex,
      data.endIndex,
      data.accepted === undefined ? null : data.accepted ? 1 : 0,
    ]
  );
  const suggestion = await findSuggestionById(id);
  if (!suggestion) throw new Error("Failed to create suggestion");
  return suggestion;
}

export async function createSuggestions(
  items: CreateSuggestionInput[]
): Promise<Suggestion[]> {
  const results: Suggestion[] = [];
  for (const item of items) {
    results.push(await createSuggestion(item));
  }
  return results;
}

export async function updateSuggestionAccepted(
  id: string,
  accepted: boolean | null
): Promise<Suggestion> {
  await execute("UPDATE suggestions SET accepted = ? WHERE id = ?", [
    accepted === null ? null : accepted ? 1 : 0,
    id,
  ]);
  const suggestion = await findSuggestionById(id);
  if (!suggestion) throw new Error("Suggestion not found");
  return suggestion;
}

export async function deleteSuggestionsByDocumentId(documentId: string): Promise<void> {
  await execute("DELETE FROM suggestions WHERE document_id = ?", [documentId]);
}

export async function deleteSuggestion(id: string): Promise<void> {
  await execute("DELETE FROM suggestions WHERE id = ?", [id]);
}

export async function countSuggestionsByDocumentId(documentId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM suggestions WHERE document_id = ?",
    [documentId]
  );
  return Number(row?.count ?? 0);
}
