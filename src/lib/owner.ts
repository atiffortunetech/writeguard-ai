import { makeUserAdmin } from "@/lib/db";
import type { User } from "@/types/database";

/** Comma-separated owner emails in OWNER_EMAIL or APP_OWNER_EMAIL */
export function getOwnerEmails(): string[] {
  const raw = process.env.OWNER_EMAIL ?? process.env.APP_OWNER_EMAIL ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email: string): boolean {
  const owners = getOwnerEmails();
  if (owners.length === 0) return false;
  return owners.includes(email.trim().toLowerCase());
}

export function roleForNewUser(email: string): "ADMIN" | "USER" {
  return isOwnerEmail(email) ? "ADMIN" : "USER";
}

/** Promote SaaS owner to ADMIN if configured and not already admin */
export async function ensureOwnerIsAdmin(user: User): Promise<User> {
  if (user.role === "ADMIN" || !isOwnerEmail(user.email)) {
    return user;
  }
  return makeUserAdmin(user.id);
}
