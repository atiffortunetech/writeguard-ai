import type { TeamInvite, Workspace, WorkspaceRole } from "@/types/database";
import { execute, newId, query, queryOne, type QueryParam } from "./connection";
import { mapWorkspace } from "./workspaces";

export type TeamInviteRow = {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invited_by_id: string;
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
};

export function mapTeamInvite(row: TeamInviteRow): TeamInvite {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    role: row.role,
    token: row.token,
    invitedById: row.invited_by_id,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export type CreateTeamInviteInput = {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedById: string;
  expiresAt: Date;
};

export type UpdateTeamInviteInput = Partial<{
  token: string;
  expiresAt: Date;
  role: WorkspaceRole;
  acceptedAt: Date | null;
}>;

export async function findTeamInviteById(id: string): Promise<TeamInvite | null> {
  const row = await queryOne<TeamInviteRow>("SELECT * FROM team_invites WHERE id = ?", [id]);
  return row ? mapTeamInvite(row) : null;
}

export async function findTeamInviteByToken(token: string): Promise<TeamInvite | null> {
  const row = await queryOne<TeamInviteRow>("SELECT * FROM team_invites WHERE token = ?", [token]);
  return row ? mapTeamInvite(row) : null;
}

export type TeamInviteWithWorkspace = TeamInvite & { workspace: Workspace };

export async function findTeamInviteByTokenWithWorkspace(
  token: string
): Promise<TeamInviteWithWorkspace | null> {
  type InviteWorkspaceRow = TeamInviteRow & {
    name: string;
    slug: string;
    owner_id: string;
    workspace_created_at: Date;
    workspace_updated_at: Date;
  };

  const row = await queryOne<InviteWorkspaceRow>(
    `SELECT ti.*, w.name, w.slug, w.owner_id, w.created_at AS workspace_created_at, w.updated_at AS workspace_updated_at
     FROM team_invites ti
     INNER JOIN workspaces w ON w.id = ti.workspace_id
     WHERE ti.token = ?`,
    [token]
  );
  if (!row) return null;

  return {
    ...mapTeamInvite({
      id: row.id,
      workspace_id: row.workspace_id,
      email: row.email,
      role: row.role,
      token: row.token,
      invited_by_id: row.invited_by_id,
      expires_at: row.expires_at,
      accepted_at: row.accepted_at,
      created_at: row.created_at,
    }),
    workspace: mapWorkspace({
      id: row.workspace_id,
      name: row.name,
      slug: row.slug,
      owner_id: row.owner_id,
      created_at: row.workspace_created_at,
      updated_at: row.workspace_updated_at,
    }),
  };
}

export async function findTeamInviteByWorkspaceAndEmail(
  workspaceId: string,
  email: string
): Promise<TeamInvite | null> {
  const row = await queryOne<TeamInviteRow>(
    "SELECT * FROM team_invites WHERE workspace_id = ? AND email = ?",
    [workspaceId, email.toLowerCase()]
  );
  return row ? mapTeamInvite(row) : null;
}

export async function listPendingInvitesByWorkspace(workspaceId: string): Promise<TeamInvite[]> {
  const rows = await query<TeamInviteRow>(
    `SELECT * FROM team_invites
     WHERE workspace_id = ? AND accepted_at IS NULL AND expires_at > NOW(3)`,
    [workspaceId]
  );
  return rows.map(mapTeamInvite);
}

export async function createTeamInvite(data: CreateTeamInviteInput): Promise<TeamInvite> {
  const id = newId();
  await execute(
    `INSERT INTO team_invites (id, workspace_id, email, role, token, invited_by_id, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.workspaceId,
      data.email.toLowerCase(),
      data.role,
      data.token,
      data.invitedById,
      data.expiresAt,
    ]
  );
  const invite = await findTeamInviteById(id);
  if (!invite) throw new Error("Failed to create team invite");
  return invite;
}

export async function updateTeamInvite(
  id: string,
  data: UpdateTeamInviteInput
): Promise<TeamInvite> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  if (data.token !== undefined) {
    fields.push("token = ?");
    values.push(data.token);
  }
  if (data.expiresAt !== undefined) {
    fields.push("expires_at = ?");
    values.push(data.expiresAt);
  }
  if (data.role !== undefined) {
    fields.push("role = ?");
    values.push(data.role);
  }
  if (data.acceptedAt !== undefined) {
    fields.push("accepted_at = ?");
    values.push(data.acceptedAt);
  }

  if (fields.length > 0) {
    values.push(id);
    await execute(`UPDATE team_invites SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const invite = await findTeamInviteById(id);
  if (!invite) throw new Error("Team invite not found");
  return invite;
}

export async function acceptTeamInvite(id: string): Promise<TeamInvite> {
  return updateTeamInvite(id, { acceptedAt: new Date() });
}

export async function deleteTeamInvite(id: string): Promise<void> {
  await execute("DELETE FROM team_invites WHERE id = ?", [id]);
}
