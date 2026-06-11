import type { User, UserRole } from "@/types/database";
import { execute, newId, query, queryOne, toBool, type QueryParam } from "./connection";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  email_verified: Date | null;
  image: string | null;
  password_hash: string | null;
  role: UserRole;
  banned: number | boolean;
  suspended_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.email_verified,
    image: row.image,
    passwordHash: row.password_hash,
    role: row.role,
    banned: toBool(row.banned),
    suspendedAt: row.suspended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateUserInput = {
  name?: string | null;
  email: string;
  passwordHash?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  role?: UserRole;
};

export type UpdateUserInput = Partial<{
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  passwordHash: string | null;
  role: UserRole;
  banned: boolean;
  suspendedAt: Date | null;
}>;

export async function findUserById(id: string): Promise<User | null> {
  const row = await queryOne<UserRow>("SELECT * FROM users WHERE id = ?", [id]);
  return row ? mapUser(row) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await queryOne<UserRow>("SELECT * FROM users WHERE email = ?", [email]);
  return row ? mapUser(row) : null;
}

export async function createUser(data: CreateUserInput): Promise<User> {
  const id = newId();
  await execute(
    `INSERT INTO users (id, name, email, password_hash, email_verified, image, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name ?? null,
      data.email,
      data.passwordHash ?? null,
      data.emailVerified ?? null,
      data.image ?? null,
      data.role ?? "USER",
    ]
  );
  const user = await findUserById(id);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.emailVerified !== undefined) {
    fields.push("email_verified = ?");
    values.push(data.emailVerified);
  }
  if (data.image !== undefined) {
    fields.push("image = ?");
    values.push(data.image);
  }
  if (data.passwordHash !== undefined) {
    fields.push("password_hash = ?");
    values.push(data.passwordHash);
  }
  if (data.role !== undefined) {
    fields.push("role = ?");
    values.push(data.role);
  }
  if (data.banned !== undefined) {
    fields.push("banned = ?");
    values.push(data.banned ? 1 : 0);
  }
  if (data.suspendedAt !== undefined) {
    fields.push("suspended_at = ?");
    values.push(data.suspendedAt);
  }

  if (fields.length === 0) {
    const user = await findUserById(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  values.push(id);
  await execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

  const user = await findUserById(id);
  if (!user) throw new Error("User not found");
  return user;
}

export async function listUsers(options?: {
  search?: string;
  limit?: number;
  orderBy?: "created_at" | "email";
  orderDir?: "ASC" | "DESC";
}): Promise<User[]> {
  const limit = options?.limit ?? 50;
  const orderBy = options?.orderBy ?? "created_at";
  const orderDir = options?.orderDir ?? "DESC";
  const params: QueryParam[] = [];
  let where = "";

  if (options?.search) {
    where = "WHERE email LIKE ? OR name LIKE ?";
    const term = `%${options.search}%`;
    params.push(term, term);
  }

  const rows = await query<UserRow>(
    `SELECT * FROM users ${where} ORDER BY ${orderBy} ${orderDir} LIMIT ?`,
    [...params, limit]
  );
  return rows.map(mapUser);
}

export async function countUsers(): Promise<number> {
  const row = await queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM users");
  return Number(row?.count ?? 0);
}

export async function banUser(id: string): Promise<User> {
  return updateUser(id, { banned: true });
}

export async function unbanUser(id: string): Promise<User> {
  return updateUser(id, { banned: false });
}

export async function makeUserAdmin(id: string): Promise<User> {
  return updateUser(id, { role: "ADMIN" });
}

export async function deleteUser(id: string): Promise<void> {
  await execute("DELETE FROM users WHERE id = ?", [id]);
}

export type UserWithCounts = User & {
  _count: { documents: number; aiRequestLogs: number };
  subscriptions: Array<{ plan: import("@/types/database").Plan } & import("@/types/database").Subscription>;
};

export async function listUsersWithDetails(search?: string): Promise<UserWithCounts[]> {
  const users = await listUsers({ search, limit: 50 });
  const result: UserWithCounts[] = [];

  for (const user of users) {
    const docCount = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM documents WHERE user_id = ?",
      [user.id]
    );
    const aiCount = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM ai_request_logs WHERE user_id = ?",
      [user.id]
    );
    const { findActiveSubscription } = await import("./subscriptions");
    const activeSub = await findActiveSubscription(user.id);
    const subs = activeSub ? [activeSub] : [];

    result.push({
      ...user,
      _count: {
        documents: Number(docCount?.count ?? 0),
        aiRequestLogs: Number(aiCount?.count ?? 0),
      },
      subscriptions: subs,
    });
  }

  return result;
}

export async function listRecentUsers(limit = 10): Promise<
  Pick<User, "id" | "name" | "email" | "role" | "banned" | "createdAt">[]
> {
  const rows = await query<UserRow>(
    `SELECT id, name, email, role, banned, created_at FROM users
     ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    banned: toBool(row.banned),
    createdAt: row.created_at,
  }));
}
