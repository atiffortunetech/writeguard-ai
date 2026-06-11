import { NextRequest } from "next/server";
import {
  acceptTeamInvite,
  findTeamInviteByTokenWithWorkspace,
  upsertWorkspaceMember,
} from "@/lib/db";
import { requireApiAuth, apiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const { token } = await req.json();
  if (!token) return apiError("Token required", 400);

  const invite = await findTeamInviteByTokenWithWorkspace(token);

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return apiError("Invalid or expired invitation", 400);
  }

  if (invite.email.toLowerCase() !== auth.session.user.email?.toLowerCase()) {
    return apiError("This invitation was sent to a different email address", 403);
  }

  await upsertWorkspaceMember({
    workspaceId: invite.workspaceId,
    userId: auth.session.user.id,
    role: invite.role,
    joinedAt: new Date(),
  });

  await acceptTeamInvite(invite.id);

  return Response.json({ workspace: invite.workspace });
}
