import type { ActivityLog, ActivityType } from "@/types/database";
import { execute, newId, parseJson, query, queryOne, toJson, type QueryParam } from "./connection";

type ActivityLogRow = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  type: ActivityType;
  description: string;
  metadata: unknown;
  created_at: Date;
};

function mapActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    type: row.type,
    description: row.description,
    metadata: row.metadata ? parseJson<Record<string, unknown>>(row.metadata, {}) : null,
    createdAt: row.created_at,
  };
}

export type CreateActivityLogInput = {
  userId: string;
  workspaceId?: string | null;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown> | null;
};

export async function createActivityLog(data: CreateActivityLogInput): Promise<ActivityLog> {
  const id = newId();
  await execute(
    `INSERT INTO activity_logs (id, user_id, workspace_id, type, description, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.workspaceId ?? null,
      data.type,
      data.description,
      toJson(data.metadata ?? null),
    ]
  );
  const row = await queryOne<ActivityLogRow>("SELECT * FROM activity_logs WHERE id = ?", [id]);
  if (!row) throw new Error("Failed to create activity log");
  return mapActivityLog(row);
}

export async function listActivityLogsByUserId(
  userId: string,
  options?: { workspaceId?: string; limit?: number }
): Promise<ActivityLog[]> {
  const params: QueryParam[] = [userId];
  let where = "WHERE user_id = ?";

  if (options?.workspaceId) {
    where += " AND workspace_id = ?";
    params.push(options.workspaceId);
  }

  const limit = options?.limit ?? 50;
  params.push(limit);

  const rows = await query<ActivityLogRow>(
    `SELECT * FROM activity_logs ${where} ORDER BY created_at DESC LIMIT ?`,
    params
  );
  return rows.map(mapActivityLog);
}

export async function listActivityLogsByWorkspaceId(
  workspaceId: string,
  limit = 50
): Promise<ActivityLog[]> {
  const rows = await query<ActivityLogRow>(
    "SELECT * FROM activity_logs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?",
    [workspaceId, limit]
  );
  return rows.map(mapActivityLog);
}
