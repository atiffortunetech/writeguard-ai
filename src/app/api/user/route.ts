import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  confidentialModeDefault: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  return Response.json(user);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();

  if (body.currentPassword) {
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
    });
    if (!user?.passwordHash) {
      return apiError("Password change not available for OAuth accounts", 400);
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return apiError("Current password is incorrect", 400);

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: auth.session.user.id },
      data: { passwordHash },
    });

    return Response.json({ message: "Password updated" });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const user = await prisma.user.update({
    where: { id: auth.session.user.id },
    data: { name: parsed.data.name },
    select: { id: true, name: true, email: true },
  });

  return Response.json(user);
}
