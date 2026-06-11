import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { folderSchema } from "@/lib/validations";
import { requireApiAuth, apiError } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const folders = await prisma.folder.findMany({
    where: { userId: auth.session.user.id },
    include: { _count: { select: { documents: true } } },
    orderBy: { name: "asc" },
  });

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

  const folder = await prisma.folder.create({
    data: { ...parsed.data, userId: auth.session.user.id },
  });

  return Response.json(folder, { status: 201 });
}
