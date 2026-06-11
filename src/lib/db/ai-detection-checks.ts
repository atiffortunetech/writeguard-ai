import type { AIDetectionCheck } from "@/types/database";
import { execute, newId, query, queryOne, toJson, type QueryParam } from "./connection";

type AIDetectionCheckRow = {
  id: string;
  user_id: string;
  content: string;
  ai_probability: number | null;
  human_probability: number | null;
  mixed_estimate: number | null;
  highlights: unknown;
  provider: string | null;
  status: string;
  created_at: Date;
};

function mapAIDetectionCheck(row: AIDetectionCheckRow): AIDetectionCheck {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    aiProbability: row.ai_probability,
    humanProbability: row.human_probability,
    mixedEstimate: row.mixed_estimate,
    highlights: row.highlights ?? null,
    provider: row.provider,
    status: row.status,
    createdAt: row.created_at,
  };
}

export type CreateAIDetectionCheckInput = {
  userId: string;
  content: string;
  aiProbability?: number | null;
  humanProbability?: number | null;
  mixedEstimate?: number | null;
  highlights?: unknown;
  provider?: string | null;
  status?: string;
};

export type UpdateAIDetectionCheckInput = Partial<
  Omit<AIDetectionCheck, "id" | "userId" | "content" | "createdAt">
>;

export async function findAIDetectionCheckById(id: string): Promise<AIDetectionCheck | null> {
  const row = await queryOne<AIDetectionCheckRow>(
    "SELECT * FROM ai_detection_checks WHERE id = ?",
    [id]
  );
  return row ? mapAIDetectionCheck(row) : null;
}

export async function listAIDetectionChecksByUserId(
  userId: string,
  options?: { limit?: number }
): Promise<AIDetectionCheck[]> {
  const limit = options?.limit ?? 20;
  const rows = await query<AIDetectionCheckRow>(
    "SELECT * FROM ai_detection_checks WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit]
  );
  return rows.map(mapAIDetectionCheck);
}

export async function createAIDetectionCheck(
  data: CreateAIDetectionCheckInput
): Promise<AIDetectionCheck> {
  const id = newId();
  await execute(
    `INSERT INTO ai_detection_checks (
      id, user_id, content, ai_probability, human_probability, mixed_estimate,
      highlights, provider, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.content,
      data.aiProbability ?? null,
      data.humanProbability ?? null,
      data.mixedEstimate ?? null,
      toJson(data.highlights ?? null),
      data.provider ?? null,
      data.status ?? "pending",
    ]
  );
  const check = await findAIDetectionCheckById(id);
  if (!check) throw new Error("Failed to create AI detection check");
  return check;
}

export async function updateAIDetectionCheck(
  id: string,
  data: UpdateAIDetectionCheckInput
): Promise<AIDetectionCheck> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  if (data.aiProbability !== undefined) {
    fields.push("ai_probability = ?");
    values.push(data.aiProbability);
  }
  if (data.humanProbability !== undefined) {
    fields.push("human_probability = ?");
    values.push(data.humanProbability);
  }
  if (data.mixedEstimate !== undefined) {
    fields.push("mixed_estimate = ?");
    values.push(data.mixedEstimate);
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
    await execute(`UPDATE ai_detection_checks SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const check = await findAIDetectionCheckById(id);
  if (!check) throw new Error("AI detection check not found");
  return check;
}
