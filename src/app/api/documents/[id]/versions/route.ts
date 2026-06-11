import { NextRequest } from "next/server";
import { findDocumentByIdAndUserId, listVersions } from "@/lib/db";
import { requireApiAuth, apiError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;

  const document = await findDocumentByIdAndUserId(id, auth.session.user.id);
  if (!document) return apiError("Not found", 404);

  const versions = await listVersions(id);

  return Response.json(versions);
}
