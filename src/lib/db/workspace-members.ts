import type { User, Workspace, WorkspaceMember, WorkspaceRole } from "@/types/database";
import { execute, newId, query, queryOne } from "./connection";
import { mapWorkspace, type WorkspaceRow } from "./workspaces";
import { mapUser, type UserRow } from "./users";

export type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  invited_at: Date;
  joined_at: Date | null;
};

export function mapWorkspaceMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    invitedAt: row.invited_at,
    joinedAt: row.joined_at,
  };
}

export type CreateWorkspaceMemberInput = {
  workspaceId: string;
  userId: string;
  role?: WorkspaceRole;
  joinedAt?: Date | null;
};

export async function findWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember | null> {
  const row = await queryOne<WorkspaceMemberRow>(
    "SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
    [workspaceId, userId]
  );
  return row ? mapWorkspaceMember(row) : null;
}

export async function findWorkspaceMemberById(id: string): Promise<WorkspaceMember | null> {
  const row = await queryOne<WorkspaceMemberRow>(
    "SELECT * FROM workspace_members WHERE id = ?",
    [id]
  );
  return row ? mapWorkspaceMember(row) : null;
}

export type MembershipWithWorkspace = WorkspaceMember & {
  workspace: Workspace & {
    _count: { members: number; documents: number };
    owner: Pick<User, "name" | "email">;
  };
};

export async function listMembershipsByUserId(
  userId: string
): Promise<MembershipWithWorkspace[]> {
  type MembershipRow = WorkspaceMemberRow & {
    name: string;
    slug: string;
    owner_id: string;
    workspace_created_at: Date;
    workspace_updated_at: Date;
    owner_name: string | null;
    owner_email: string;
  };

  const rows = await query<MembershipRow>(
    `SELECT wm.*, w.name, w.slug, w.owner_id, w.created_at AS workspace_created_at, w.updated_at AS workspace_updated_at,
      u.name AS owner_name, u.email AS owner_email
     FROM workspace_members wm
     INNER JOIN workspaces w ON w.id = wm.workspace_id
     INNER JOIN users u ON u.id = w.owner_id
     WHERE wm.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId]
  );

  const result: MembershipWithWorkspace[] = [];
  for (const row of rows) {
    const members = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM workspace_members WHERE workspace_id = ?",
      [row.workspace_id]
    );
    const documents = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM documents WHERE workspace_id = ?",
      [row.workspace_id]
    );

    result.push({
      ...mapWorkspaceMember({
        id: row.id,
        workspace_id: row.workspace_id,
        user_id: row.user_id,
        role: row.role,
        invited_at: row.invited_at,
        joined_at: row.joined_at,
      }),
      workspace: {
        ...mapWorkspace({
          id: row.workspace_id,
          name: row.name,
          slug: row.slug,
          owner_id: row.owner_id,
          created_at: row.workspace_created_at,
          updated_at: row.workspace_updated_at,
        }),
        _count: {
          members: Number(members?.count ?? 0),
          documents: Number(documents?.count ?? 0),
        },
        owner: {
          name: row.owner_name,
          email: row.owner_email,
        },
      },
    });
  }
  return result;
}

export async function upsertWorkspaceMember(
  data: CreateWorkspaceMemberInput & { role: WorkspaceRole }
): Promise<WorkspaceMember> {
  const existing = await findWorkspaceMember(data.workspaceId, data.userId);

  if (existing) {
    await execute(
      "UPDATE workspace_members SET role = ?, joined_at = COALESCE(?, joined_at) WHERE id = ?",
      [data.role, data.joinedAt ?? null, existing.id]
    );
    const updated = await findWorkspaceMemberById(existing.id);
    if (!updated) throw new Error("Failed to update workspace member");
    return updated;
  }

  const id = newId();
  await execute(
    `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.workspaceId, data.userId, data.role, data.joinedAt ?? null]
  );

  const member = await findWorkspaceMemberById(id);
  if (!member) throw new Error("Failed to create workspace member");
  return member;
}

export async function createWorkspaceMember(
  data: CreateWorkspaceMemberInput
): Promise<WorkspaceMember> {
  const id = newId();
  await execute(
    `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      data.workspaceId,
      data.userId,
      data.role ?? "EDITOR",
      data.joinedAt ?? null,
    ]
  );
  const member = await findWorkspaceMemberById(id);
  if (!member) throw new Error("Failed to create workspace member");
  return member;
}

export async function updateWorkspaceMemberRole(
  id: string,
  role: WorkspaceRole
): Promise<WorkspaceMember> {
  await execute("UPDATE workspace_members SET role = ? WHERE id = ?", [role, id]);
  const member = await findWorkspaceMemberById(id);
  if (!member) throw new Error("Workspace member not found");
  return member;
}

export async function deleteWorkspaceMember(id: string): Promise<void> {
  await execute("DELETE FROM workspace_members WHERE id = ?", [id]);
}

export async function deleteWorkspaceMemberByWorkspaceAndUser(
  workspaceId: string,
  userId: string
): Promise<void> {
  await execute(
    "DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
    [workspaceId, userId]
  );
}
