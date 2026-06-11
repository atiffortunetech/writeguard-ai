import { NextRequest } from "next/server";
import {
  deleteStyleGuide,
  findStyleGuideByIdAndUserId,
  updateStyleGuide,
} from "@/lib/db";
import { styleGuideSchema } from "@/lib/validations";
import { requireApiAuth, apiError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;

  const guide = await findStyleGuideByIdAndUserId(id, auth.session.user.id);
  if (!guide) return apiError("Not found", 404);
  return Response.json(guide);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;

  const existing = await findStyleGuideByIdAndUserId(id, auth.session.user.id);
  if (!existing) return apiError("Not found", 404);

  const body = await req.json();
  const parsed = styleGuideSchema.partial().safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const guide = await updateStyleGuide(id, parsed.data);
  return Response.json(guide);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;

  const existing = await findStyleGuideByIdAndUserId(id, auth.session.user.id);
  if (!existing) return apiError("Not found", 404);

  await deleteStyleGuide(id);
  return Response.json({ success: true });
}
