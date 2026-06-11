import type { AIRequestLog } from "@/types/database";
import { execute, newId, query, queryOne, toBool, type QueryParam } from "./connection";

type AIRequestLogRow = {
  id: string;
  user_id: string;
  endpoint: string;
  model: string | null;
  tokens_used: number;
  prompt_tokens: number;
  success: number | boolean;
  error_message: string | null;
  duration_ms: number | null;
  created_at: Date;
};

function mapAIRequestLog(row: AIRequestLogRow): AIRequestLog {
  return {
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    model: row.model,
    tokensUsed: row.tokens_used,
    promptTokens: row.prompt_tokens,
    success: toBool(row.success),
    errorMessage: row.error_message,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  };
}

export type CreateAIRequestLogInput = {
  userId: string;
  endpoint: string;
  model?: string | null;
  tokensUsed?: number;
  promptTokens?: number;
  success?: boolean;
  errorMessage?: string | null;
  durationMs?: number | null;
};

export async function createAIRequestLog(data: CreateAIRequestLogInput): Promise<AIRequestLog> {
  const id = newId();
  await execute(
    `INSERT INTO ai_request_logs (
      id, user_id, endpoint, model, tokens_used, prompt_tokens, success, error_message, duration_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.endpoint,
      data.model ?? null,
      data.tokensUsed ?? 0,
      data.promptTokens ?? 0,
      data.success !== false ? 1 : 0,
      data.errorMessage ?? null,
      data.durationMs ?? null,
    ]
  );
  const row = await queryOne<AIRequestLogRow>("SELECT * FROM ai_request_logs WHERE id = ?", [id]);
  if (!row) throw new Error("Failed to create AI request log");
  return mapAIRequestLog(row);
}

export async function listAIRequestLogsByUserId(
  userId: string,
  options?: { limit?: number; since?: Date }
): Promise<AIRequestLog[]> {
  const params: QueryParam[] = [userId];
  let where = "WHERE user_id = ?";

  if (options?.since) {
    where += " AND created_at >= ?";
    params.push(options.since);
  }

  const limit = options?.limit ?? 100;
  params.push(limit);

  const rows = await query<AIRequestLogRow>(
    `SELECT * FROM ai_request_logs ${where} ORDER BY created_at DESC LIMIT ?`,
    params
  );
  return rows.map(mapAIRequestLog);
}

export async function countAIRequestLogs(options?: {
  userId?: string;
  since?: Date;
}): Promise<number> {
  const conditions: string[] = [];
  const params: QueryParam[] = [];

  if (options?.userId) {
    conditions.push("user_id = ?");
    params.push(options.userId);
  }
  if (options?.since) {
    conditions.push("created_at >= ?");
    params.push(options.since);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM ai_request_logs ${where}`,
    params
  );
  return Number(row?.count ?? 0);
}
