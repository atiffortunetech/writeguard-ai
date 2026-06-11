import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { teamInviteSchema } from "@/lib/validations";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { sendTeamInviteEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { randomBytes } from "crypto";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;

  const workspace = await prisma.workspace.findFirst({
    where: {
      id,
      OR: [
        { ownerId: auth.session.user.id },
        { members: { some: { userId: auth.session.user.id } } },
      ],
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      invites: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      },
    },
  });

  if (!workspace) return apiError("Not found", 404);
  return Response.json(workspace);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { id } = await ctx.params;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        OR: [
          { ownerId: auth.session.user.id },
          { members: { some: { userId: auth.session.user.id, role: { in: ["OWNER", "ADMIN"] } } } },
        ],
      },
    });
    if (!workspace) return apiError("Not found or insufficient permissions", 404);

    const body = await req.json();
    const parsed = teamInviteSchema.safeParse({ ...body, workspaceId: id });
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const email = parsed.data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      const member = await prisma.workspaceMember.findFirst({
        where: { workspaceId: id, userId: existingUser.id },
      });
      if (member) {
        return apiError("This person is already a member of this workspace", 400);
      }
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existingInvite = await prisma.teamInvite.findFirst({
      where: { workspaceId: id, email },
    });

    let invite;
    let resent = false;

    if (existingInvite) {
      if (existingInvite.acceptedAt) {
        return apiError("This email has already accepted an invitation to this workspace", 400);
      }
      invite = await prisma.teamInvite.update({
        where: { id: existingInvite.id },
        data: { token, expiresAt, role: parsed.data.role },
      });
      resent = true;
    } else {
      invite = await prisma.teamInvite.create({
        data: {
          workspaceId: id,
          email,
          role: parsed.data.role,
          token,
          invitedById: auth.session.user.id,
          expiresAt,
        },
      });
    }

    const emailResult = await sendTeamInviteEmail(email, workspace.name, token);

    await logActivity({
      userId: auth.session.user.id,
      workspaceId: id,
      type: "TEAM_MEMBER_INVITED",
      description: `${resent ? "Resent invite" : "Invited"} ${email} to ${workspace.name}`,
    });

    return Response.json(
      {
        ...invite,
        resent,
        emailSent: emailResult.ok,
        acceptUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/team/accept?token=${token}`,
        message: emailResult.ok
          ? resent
            ? "Invitation resent"
            : "Invitation sent"
          : resent
            ? "Invite updated. Email is not configured — share the accept link from pending invites."
            : "Invite created. Email is not configured — share the accept link manually.",
      },
      { status: resent ? 200 : 201 }
    );
  } catch (err) {
    console.error("Team invite error:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return apiError("An invitation for this email already exists for this workspace", 409);
    }
    return apiError(
      err instanceof Error ? err.message : "Failed to send invitation",
      500
    );
  }
}
