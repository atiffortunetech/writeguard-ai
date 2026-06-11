import type { PlagiarismCheck } from "@/types/database";
import { execute, newId, query, queryOne, toJson, type QueryParam } from "./connection";

type PlagiarismCheckRow = {
  id: string;
  user_id: string;
  content: string;
  similarity_score: number | null;
  matched_sources: unknown;
  highlights: unknown;
  provider: string | null;
  status: string;
  created_at: Date;
};

function mapPlagiarismCheck(row: PlagiarismCheckRow): PlagiarismCheck {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    similarityScore: row.similarity_score,
    matchedSources: row.matched_sources ?? null,
    highlights: row.highlights ?? null,
    provider: row.provider,
    status: row.status,
    createdAt: row.created_at,
  };
}

export type CreatePlagiarismCheckInput = {
  userId: string;
  content: string;
  similarityScore?: number | null;
  matchedSources?: unknown;
  highlights?: unknown;
  provider?: string | null;
  status?: string;
};

export type UpdatePlagiarismCheckInput = Partial<
  Omit<PlagiarismCheck, "id" | "userId" | "content" | "createdAt">
>;

export async function findPlagiarismCheckById(id: string): Promise<PlagiarismCheck | null> {
  const row = await queryOne<PlagiarismCheckRow>(
    "SELECT * FROM plagiarism_checks WHERE id = ?",
    [id]
  );
  return row ? mapPlagiarismCheck(row) : null;
}

export async function listPlagiarismChecksByUserId(
  userId: string,
  options?: { limit?: number }
): Promise<PlagiarismCheck[]> {
  const limit = options?.limit ?? 20;
  const rows = await query<PlagiarismCheckRow>(
    "SELECT * FROM plagiarism_checks WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit]
  );
  return rows.map(mapPlagiarismCheck);
}

export async function createPlagiarismCheck(
  data: CreatePlagiarismCheckInput
): Promise<PlagiarismCheck> {
  const id = newId();
  await execute(
    `INSERT INTO plagiarism_checks (
      id, user_id, content, similarity_score, matched_sources, highlights, provider, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.content,
      data.similarityScore ?? null,
      toJson(data.matchedSources ?? null),
      toJson(data.highlights ?? null),
      data.provider ?? null,
      data.status ?? "pending",
    ]
  );
  const check = await findPlagiarismCheckById(id);
  if (!check) throw new Error("Failed to create plagiarism check");
  return check;
}

export async function updatePlagiarismCheck(
  id: string,
  data: UpdatePlagiarismCheckInput
): Promise<PlagiarismCheck> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  if (data.similarityScore !== undefined) {
    fields.push("similarity_score = ?");
    values.push(data.similarityScore);
  }
  if (data.matchedSources !== undefined) {
    fields.push("matched_sources = ?");
    values.push(toJson(data.matchedSources));
  }
  if (data.highlights !== undefined) {
    fields.push("highlights = ?");
    values.push(toJson(data.highlights));
  }
  if (data.provider !== undefined) {
    fields.push("provider = ?");
    values.push(data.provider);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }

  if (fields.length > 0) {
    values.push(id);
    await execute(`UPDATE plagiarism_checks SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const check = await findPlagiarismCheckById(id);
  if (!check) throw new Error("Plagiarism check not found");
  return check;
}
