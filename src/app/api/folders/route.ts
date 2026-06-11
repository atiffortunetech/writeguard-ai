import { NextRequest } from "next/server";
import { createFolder, listFoldersByUserId } from "@/lib/db";
import { folderSchema } from "@/lib/validations";
import { requireApiAuth, apiError } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const folders = await listFoldersByUserId(auth.session.user.id);

  return Response.json(folders);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = folderSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const folder = await createFolder({
    ...parsed.data,
    userId: auth.session.user.id,
  });

  return Response.json(folder, { status: 201 });
}
