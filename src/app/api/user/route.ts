import { NextRequest } from "next/server";
import { findUserById, updateUser } from "@/lib/db";
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

  const user = await findUserById(auth.session.user.id);
  if (!user) return Response.json(null);

  return Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt,
  });
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

    const user = await findUserById(auth.session.user.id);
    if (!user?.passwordHash) {
      return apiError("Password change not available for OAuth accounts", 400);
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return apiError("Current password is incorrect", 400);

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await updateUser(auth.session.user.id, { passwordHash });

    return Response.json({ message: "Password updated" });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const user = await updateUser(auth.session.user.id, { name: parsed.data.name });

  return Response.json({ id: user.id, name: user.name, email: user.email });
}
