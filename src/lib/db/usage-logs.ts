import type { UsageLog } from "@/types/database";
import { execute, newId, parseJson, query, queryOne, toJson, type QueryParam } from "./connection";

type UsageLogRow = {
  id: string;
  user_id: string;
  action: string;
  quantity: number;
  metadata: unknown;
  created_at: Date;
};

function mapUsageLog(row: UsageLogRow): UsageLog {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    quantity: row.quantity,
    metadata: row.metadata ? parseJson<Record<string, unknown>>(row.metadata, {}) : null,
    createdAt: row.created_at,
  };
}

export type CreateUsageLogInput = {
  userId: string;
  action: string;
  quantity?: number;
  metadata?: Record<string, unknown> | null;
};

export async function createUsageLog(data: CreateUsageLogInput): Promise<UsageLog> {
  const id = newId();
  await execute(
    "INSERT INTO usage_logs (id, user_id, action, quantity, metadata) VALUES (?, ?, ?, ?, ?)",
    [id, data.userId, data.action, data.quantity ?? 1, toJson(data.metadata ?? null)]
  );
  const row = await queryOne<UsageLogRow>("SELECT * FROM usage_logs WHERE id = ?", [id]);
  if (!row) throw new Error("Failed to create usage log");
  return mapUsageLog(row);
}

export async function listUsageLogsByUserId(
  userId: string,
  options?: { action?: string; limit?: number }
): Promise<UsageLog[]> {
  const params: QueryParam[] = [userId];
  let where = "WHERE user_id = ?";

  if (options?.action) {
    where += " AND action = ?";
    params.push(options.action);
  }

  const limit = options?.limit ?? 100;
  params.push(limit);

  const rows = await query<UsageLogRow>(
    `SELECT * FROM usage_logs ${where} ORDER BY created_at DESC LIMIT ?`,
    params
  );
  return rows.map(mapUsageLog);
}

export async function countUsageLogs(userId: string, action?: string): Promise<number> {
  if (action) {
    const row = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM usage_logs WHERE user_id = ? AND action = ?",
      [userId, action]
    );
    return Number(row?.count ?? 0);
  }
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM usage_logs WHERE user_id = ?",
    [userId]
  );
  return Number(row?.count ?? 0);
}
