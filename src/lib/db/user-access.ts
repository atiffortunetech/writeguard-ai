import type { PlanTier } from "@/types/database";
import type { ToolsAccessMode, UserAccess } from "@/types/database";
import { execute, queryOne, type QueryParam } from "./connection";

export type UserAccessRow = {
  user_id: string;
  credit_limit: number | null;
  tools_mode: ToolsAccessMode;
  feature_tier: PlanTier | null;
  admin_notes: string | null;
  granted_by_id: string | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export function mapUserAccess(row: UserAccessRow): UserAccess {
  return {
    userId: row.user_id,
    creditLimit: row.credit_limit,
    toolsMode: row.tools_mode,
    featureTier: row.feature_tier,
    adminNotes: row.admin_notes,
    grantedById: row.granted_by_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findUserAccess(userId: string): Promise<UserAccess | null> {
  const row = await queryOne<UserAccessRow>(
    "SELECT * FROM user_access WHERE user_id = ?",
    [userId]
  );
  return row ? mapUserAccess(row) : null;
}

export type UpsertUserAccessInput = {
  userId: string;
  creditLimit?: number | null;
  toolsMode?: ToolsAccessMode;
  featureTier?: PlanTier | null;
  adminNotes?: string | null;
  grantedById?: string | null;
  expiresAt?: Date | null;
};

export async function upsertUserAccess(data: UpsertUserAccessInput): Promise<UserAccess> {
  const existing = await findUserAccess(data.userId);

  if (!existing) {
    const id = data.userId;
    await execute(
      `INSERT INTO user_access (user_id, credit_limit, tools_mode, feature_tier, admin_notes, granted_by_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.creditLimit ?? 0,
        data.toolsMode ?? "locked",
        data.featureTier ?? null,
        data.adminNotes ?? null,
        data.grantedById ?? null,
        data.expiresAt ?? null,
      ]
    );
  } else {
    const fields: string[] = [];
    const values: QueryParam[] = [];

    if (data.creditLimit !== undefined) {
      fields.push("credit_limit = ?");
      values.push(data.creditLimit);
    }
    if (data.toolsMode !== undefined) {
      fields.push("tools_mode = ?");
      values.push(data.toolsMode);
    }
    if (data.featureTier !== undefined) {
      fields.push("feature_tier = ?");
      values.push(data.featureTier);
    }
    if (data.adminNotes !== undefined) {
      fields.push("admin_notes = ?");
      values.push(data.adminNotes);
    }
    if (data.grantedById !== undefined) {
      fields.push("granted_by_id = ?");
      values.push(data.grantedById);
    }
    if (data.expiresAt !== undefined) {
      fields.push("expires_at = ?");
      values.push(data.expiresAt);
    }

    if (fields.length > 0) {
      values.push(data.userId);
      await execute(
        `UPDATE user_access SET ${fields.join(", ")} WHERE user_id = ?`,
        values
      );
    }
  }

  const access = await findUserAccess(data.userId);
  if (!access) throw new Error("Failed to save user access");
  return access;
}

/** New signups: locked until admin grants access */
export async function createDefaultUserAccess(userId: string): Promise<UserAccess> {
  return upsertUserAccess({
    userId,
    creditLimit: 0,
    toolsMode: "locked",
    featureTier: null,
    adminNotes: "Awaiting admin activation",
  });
}

export async function deleteUserAccess(userId: string): Promise<void> {
  await execute("DELETE FROM user_access WHERE user_id = ?", [userId]);
}
