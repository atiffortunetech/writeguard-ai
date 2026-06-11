import { NextRequest } from "next/server";
import {
  createVerificationToken,
  deleteVerificationToken,
  deleteVerificationTokensByIdentifier,
  findUserByEmail,
  findVerificationTokenByToken,
  updateUser,
} from "@/lib/db";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";
import { sendPasswordResetEmail } from "@/lib/email";
import { apiError } from "@/lib/api-utils";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const user = await findUserByEmail(parsed.data.email);

  // Always return success to prevent email enumeration
  if (!user) {
    return Response.json({ message: "If an account exists, a reset link was sent." });
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await deleteVerificationTokensByIdentifier(`reset:${parsed.data.email}`);

  await createVerificationToken({
    identifier: `reset:${parsed.data.email}`,
    token,
    expires,
  });

  await sendPasswordResetEmail(parsed.data.email, token);

  return Response.json({ message: "If an account exists, a reset link was sent." });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const record = await findVerificationTokenByToken(parsed.data.token);

  if (!record || record.expires < new Date() || !record.identifier.startsWith("reset:")) {
    return apiError("Invalid or expired reset token", 400);
  }

  const email = record.identifier.replace("reset:", "");
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await findUserByEmail(email);
  if (!user) return apiError("Invalid or expired reset token", 400);
  await updateUser(user.id, { passwordHash });

  await deleteVerificationToken(parsed.data.token);

  return Response.json({ message: "Password reset successfully" });
}
