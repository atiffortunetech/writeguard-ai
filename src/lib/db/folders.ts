import type { Folder } from "@/types/database";
import { execute, newId, query, queryOne } from "./connection";

type FolderRow = {
  id: string;
  name: string;
  user_id: string;
  workspace_id: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateFolderInput = {
  name: string;
  userId: string;
  workspaceId?: string | null;
};

export async function findFolderById(id: string): Promise<Folder | null> {
  const row = await queryOne<FolderRow>("SELECT * FROM folders WHERE id = ?", [id]);
  return row ? mapFolder(row) : null;
}

export async function listFoldersByUserId(userId: string): Promise<Folder[]> {
  const rows = await query<FolderRow>(
    "SELECT * FROM folders WHERE user_id = ? ORDER BY name ASC",
    [userId]
  );
  return rows.map(mapFolder);
}

export async function createFolder(data: CreateFolderInput): Promise<Folder> {
  const id = newId();
  await execute(
    "INSERT INTO folders (id, name, user_id, workspace_id) VALUES (?, ?, ?, ?)",
    [id, data.name, data.userId, data.workspaceId ?? null]
  );
  const folder = await findFolderById(id);
  if (!folder) throw new Error("Failed to create folder");
  return folder;
}

export async function deleteFolder(id: string): Promise<void> {
  await execute("DELETE FROM folders WHERE id = ?", [id]);
}
