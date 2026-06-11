import type { Account, Session, User } from "@/types/database";
import { execute, newId, query, queryOne } from "./connection";
import { mapUser, type UserRow } from "./users";

type AccountRow = {
  id: string;
  user_id: string;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};

type SessionRow = {
  id: string;
  session_token: string;
  user_id: string;
  expires: Date;
};

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    refreshToken: row.refresh_token,
    accessToken: row.access_token,
    expiresAt: row.expires_at,
    tokenType: row.token_type,
    scope: row.scope,
    idToken: row.id_token,
    sessionState: row.session_state,
  };
}

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    sessionToken: row.session_token,
    userId: row.user_id,
    expires: row.expires,
  };
}

export type CreateAccountInput = Omit<Account, "id"> & { id?: string };

export async function findAccountByProvider(
  provider: string,
  providerAccountId: string
): Promise<Account | null> {
  const row = await queryOne<AccountRow>(
    "SELECT * FROM accounts WHERE provider = ? AND provider_account_id = ?",
    [provider, providerAccountId]
  );
  return row ? mapAccount(row) : null;
}

export async function findAccountsByUserId(userId: string): Promise<Account[]> {
  const rows = await query<AccountRow>("SELECT * FROM accounts WHERE user_id = ?", [userId]);
  return rows.map(mapAccount);
}

export async function findUserByAccount(
  provider: string,
  providerAccountId: string
): Promise<User | null> {
  const row = await queryOne<UserRow>(
    `SELECT u.* FROM users u
     INNER JOIN accounts a ON a.user_id = u.id
     WHERE a.provider = ? AND a.provider_account_id = ?`,
    [provider, providerAccountId]
  );
  return row ? mapUser(row) : null;
}

export async function linkAccount(data: CreateAccountInput): Promise<Account> {
  const id = data.id ?? newId();
  await execute(
    `INSERT INTO accounts (
      id, user_id, type, provider, provider_account_id,
      refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.type,
      data.provider,
      data.providerAccountId,
      data.refreshToken ?? null,
      data.accessToken ?? null,
      data.expiresAt ?? null,
      data.tokenType ?? null,
      data.scope ?? null,
      data.idToken ?? null,
      data.sessionState ?? null,
    ]
  );
  const account = await queryOne<AccountRow>("SELECT * FROM accounts WHERE id = ?", [id]);
  if (!account) throw new Error("Failed to link account");
  return mapAccount(account);
}

export async function unlinkAccount(
  provider: string,
  providerAccountId: string
): Promise<void> {
  await execute(
    "DELETE FROM accounts WHERE provider = ? AND provider_account_id = ?",
    [provider, providerAccountId]
  );
}

// Session operations (NextAuth adapter)

export async function findSessionByToken(sessionToken: string): Promise<Session | null> {
  const row = await queryOne<SessionRow>(
    "SELECT * FROM sessions WHERE session_token = ?",
    [sessionToken]
  );
  return row ? mapSession(row) : null;
}

export async function getSessionAndUser(
  sessionToken: string
): Promise<{ session: Session; user: User } | null> {
  const row = await queryOne<SessionRow & UserRow>(
    `SELECT s.id, s.session_token, s.user_id, s.expires, u.*
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.session_token = ?`,
    [sessionToken]
  );
  if (!row) return null;

  return {
    session: mapSession({
      id: row.id,
      session_token: row.session_token,
      user_id: row.user_id,
      expires: row.expires,
    }),
    user: mapUser(row),
  };
}

export async function createSession(data: {
  sessionToken: string;
  userId: string;
  expires: Date;
}): Promise<Session> {
  const id = newId();
  await execute(
    "INSERT INTO sessions (id, session_token, user_id, expires) VALUES (?, ?, ?, ?)",
    [id, data.sessionToken, data.userId, data.expires]
  );
  const session = await findSessionByToken(data.sessionToken);
  if (!session) throw new Error("Failed to create session");
  return session;
}

export async function updateSession(
  sessionToken: string,
  data: { expires?: Date }
): Promise<Session | null> {
  if (data.expires) {
    await execute("UPDATE sessions SET expires = ? WHERE session_token = ?", [
      data.expires,
      sessionToken,
    ]);
  }
  return findSessionByToken(sessionToken);
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await execute("DELETE FROM sessions WHERE session_token = ?", [sessionToken]);
}

export async function deleteSessionsByUserId(userId: string): Promise<void> {
  await execute("DELETE FROM sessions WHERE user_id = ?", [userId]);
}
