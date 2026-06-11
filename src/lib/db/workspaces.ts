import type { TeamInvite, User, Workspace, WorkspaceMember, WorkspaceRole } from "@/types/database";
import { execute, newId, query, queryOne, type QueryParam } from "./connection";
import { mapTeamInvite, type TeamInviteRow } from "./team-invites";
import { mapWorkspaceMember, type WorkspaceMemberRow } from "./workspace-members";
import { mapUser, type UserRow } from "./users";

export type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
};

export function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateWorkspaceInput = {
  name: string;
  slug: string;
  ownerId: string;
  addOwnerAsMember?: boolean;
};

export async function findWorkspaceById(id: string): Promise<Workspace | null> {
  const row = await queryOne<WorkspaceRow>("SELECT * FROM workspaces WHERE id = ?", [id]);
  return row ? mapWorkspace(row) : null;
}

export async function findWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  const row = await queryOne<WorkspaceRow>("SELECT * FROM workspaces WHERE slug = ?", [slug]);
  return row ? mapWorkspace(row) : null;
}

export async function listWorkspacesByOwnerId(ownerId: string): Promise<
  Array<Workspace & { _count: { members: number; documents: number } }>
> {
  const rows = await query<WorkspaceRow>(
    "SELECT * FROM workspaces WHERE owner_id = ? ORDER BY created_at DESC",
    [ownerId]
  );

  const result = [];
  for (const row of rows) {
    const members = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM workspace_members WHERE workspace_id = ?",
      [row.id]
    );
    const documents = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM documents WHERE workspace_id = ?",
      [row.id]
    );
    result.push({
      ...mapWorkspace(row),
      _count: {
        members: Number(members?.count ?? 0),
        documents: Number(documents?.count ?? 0),
      },
    });
  }
  return result;
}

export async function findWorkspaceAccessibleByUser(
  workspaceId: string,
  userId: string
): Promise<Workspace | null> {
  const row = await queryOne<WorkspaceRow>(
    `SELECT w.* FROM workspaces w
     LEFT JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = ?
     WHERE w.id = ? AND (w.owner_id = ? OR wm.id IS NOT NULL)
     LIMIT 1`,
    [userId, workspaceId, userId]
  );
  return row ? mapWorkspace(row) : null;
}

export async function findWorkspaceWithAdminAccess(
  workspaceId: string,
  userId: string
): Promise<Workspace | null> {
  const row = await queryOne<WorkspaceRow>(
    `SELECT w.* FROM workspaces w
     LEFT JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = ?
     WHERE w.id = ?
       AND (w.owner_id = ? OR (wm.id IS NOT NULL AND wm.role IN ('OWNER', 'ADMIN')))
     LIMIT 1`,
    [userId, workspaceId, userId]
  );
  return row ? mapWorkspace(row) : null;
}

export type WorkspaceDetail = Workspace & {
  members: Array<WorkspaceMember & { user: Pick<User, "id" | "name" | "email" | "image"> }>;
  invites: TeamInvite[];
};

export async function findWorkspaceDetail(
  workspaceId: string,
  userId: string
): Promise<WorkspaceDetail | null> {
  const workspace = await findWorkspaceAccessibleByUser(workspaceId, userId);
  if (!workspace) return null;

  const memberRows = await query<WorkspaceMemberRow & UserRow>(
    `SELECT wm.*, u.name, u.email, u.image
     FROM workspace_members wm
     INNER JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = ?`,
    [workspaceId]
  );

  const inviteRows = await query<TeamInviteRow>(
    `SELECT * FROM team_invites
     WHERE workspace_id = ? AND accepted_at IS NULL AND expires_at > NOW(3)`,
    [workspaceId]
  );

  return {
    ...workspace,
    members: memberRows.map((row) => ({
      ...mapWorkspaceMember({
        id: row.id,
        workspace_id: row.workspace_id,
        user_id: row.user_id,
        role: row.role,
        invited_at: row.invited_at,
        joined_at: row.joined_at,
      }),
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        image: row.image,
      },
    })),
    invites: inviteRows.map(mapTeamInvite),
  };
}

export async function createWorkspace(data: CreateWorkspaceInput): Promise<Workspace> {
  const id = newId();
  await execute(
    "INSERT INTO workspaces (id, name, slug, owner_id) VALUES (?, ?, ?, ?)",
    [id, data.name, data.slug, data.ownerId]
  );

  if (data.addOwnerAsMember !== false) {
    const memberId = newId();
    await execute(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
       VALUES (?, ?, ?, 'OWNER', NOW(3))`,
      [memberId, id, data.ownerId]
    );
  }

  const workspace = await findWorkspaceById(id);
  if (!workspace) throw new Error("Failed to create workspace");
  return workspace;
}

export async function updateWorkspace(
  id: string,
  data: Partial<Pick<Workspace, "name" | "slug">>
): Promise<Workspace> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.slug !== undefined) {
    fields.push("slug = ?");
    values.push(data.slug);
  }

  if (fields.length > 0) {
    values.push(id);
    await execute(`UPDATE workspaces SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const workspace = await findWorkspaceById(id);
  if (!workspace) throw new Error("Workspace not found");
  return workspace;
}

export async function deleteWorkspace(id: string): Promise<void> {
  await execute("DELETE FROM workspaces WHERE id = ?", [id]);
}
