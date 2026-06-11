import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { workspaceSchema } from "@/lib/validations";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { getUserPlanTier } from "@/lib/usage";
import { logActivity } from "@/lib/activity";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: auth.session.user.id },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true, documents: true } },
          owner: { select: { name: true, email: true } },
        },
      },
    },
  });

  const owned = await prisma.workspace.findMany({
    where: { ownerId: auth.session.user.id },
    include: { _count: { select: { members: true, documents: true } } },
  });

  const ownedIds = new Set(owned.map((w) => w.id));
  const membershipsOnly = memberships.filter((m) => !ownedIds.has(m.workspaceId));

  return Response.json({ memberships: membershipsOnly, owned });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const tier = await getUserPlanTier(auth.session.user.id);
  if (tier !== "BUSINESS" && tier !== "ENTERPRISE") {
    return apiError("Team workspace requires Business plan or higher.", 403);
  }

  const body = await req.json();
  const parsed = workspaceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  let slug = slugify(parsed.data.name);
  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      slug,
      ownerId: auth.session.user.id,
      members: {
        create: {
          userId: auth.session.user.id,
          role: "OWNER",
          joinedAt: new Date(),
        },
      },
    },
  });

  await logActivity({
    userId: auth.session.user.id,
    workspaceId: workspace.id,
    type: "TEAM_MEMBER_INVITED",
    description: `Created workspace ${workspace.name}`,
  });

  return Response.json(workspace, { status: 201 });
}
