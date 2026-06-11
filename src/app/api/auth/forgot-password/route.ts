import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return Response.json({ message: "If an account exists, a reset link was sent." });
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${parsed.data.email}` },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: `reset:${parsed.data.email}`,
      token,
      expires,
    },
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

  const record = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.expires < new Date() || !record.identifier.startsWith("reset:")) {
    return apiError("Invalid or expired reset token", 400);
  }

  const email = record.identifier.replace("reset:", "");
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.verificationToken.delete({ where: { token: parsed.data.token } });

  return Response.json({ message: "Password reset successfully" });
}
