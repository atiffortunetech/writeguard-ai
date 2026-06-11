import type { VerificationToken } from "@/types/database";
import { execute, query, queryOne } from "./connection";

type VerificationTokenRow = {
  identifier: string;
  token: string;
  expires: Date;
};

function mapVerificationToken(row: VerificationTokenRow): VerificationToken {
  return {
    identifier: row.identifier,
    token: row.token,
    expires: row.expires,
  };
}

export async function findVerificationTokenByToken(
  token: string
): Promise<VerificationToken | null> {
  const row = await queryOne<VerificationTokenRow>(
    "SELECT * FROM verification_tokens WHERE token = ?",
    [token]
  );
  return row ? mapVerificationToken(row) : null;
}

export async function findVerificationToken(
  identifier: string,
  token: string
): Promise<VerificationToken | null> {
  const row = await queryOne<VerificationTokenRow>(
    "SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?",
    [identifier, token]
  );
  return row ? mapVerificationToken(row) : null;
}

export async function createVerificationToken(data: {
  identifier: string;
  token: string;
  expires: Date;
}): Promise<VerificationToken> {
  await execute(
    "INSERT INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)",
    [data.identifier, data.token, data.expires]
  );
  const record = await findVerificationToken(data.identifier, data.token);
  if (!record) throw new Error("Failed to create verification token");
  return record;
}

export async function deleteVerificationTokensByIdentifier(
  identifier: string
): Promise<void> {
  await execute("DELETE FROM verification_tokens WHERE identifier = ?", [identifier]);
}

export async function deleteVerificationToken(token: string): Promise<void> {
  await execute("DELETE FROM verification_tokens WHERE token = ?", [token]);
}

/** NextAuth adapter: consume token atomically */
export async function useVerificationToken(
  identifier: string,
  token: string
): Promise<VerificationToken | null> {
  const record = await findVerificationToken(identifier, token);
  if (!record) return null;
  await deleteVerificationToken(token);
  return record;
}
