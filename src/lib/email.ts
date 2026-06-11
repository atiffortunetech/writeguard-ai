import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.EMAIL_FROM ?? "WriteGuard AI <noreply@writeguard.ai>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function isEmailConfigured(): boolean {
  return Boolean(resend);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!resend) {
    console.warn("[Email] Resend not configured. Reset token:", token);
    return { ok: false, reason: "Email provider not configured" };
  }

  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from,
    to: email,
    subject: "Reset your WriteGuard AI password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

  return { ok: true };
}

export async function sendVerificationEmail(email: string, token: string) {
  if (!resend) {
    console.warn("[Email] Resend not configured. Verify token:", token);
    return { ok: false, reason: "Email provider not configured" };
  }

  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from,
    to: email,
    subject: "Verify your WriteGuard AI email",
    html: `
      <h2>Welcome to WriteGuard AI</h2>
      <p>Please verify your email address:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    `,
  });

  return { ok: true };
}

export async function sendTeamInviteEmail(
  email: string,
  workspaceName: string,
  token: string
) {
  if (!resend) {
    console.warn("[Email] Team invite token:", token);
    return { ok: false, reason: "Email provider not configured" };
  }

  const inviteUrl = `${appUrl}/dashboard/team/accept?token=${token}`;

  await resend.emails.send({
    from,
    to: email,
    subject: `You've been invited to ${workspaceName} on WriteGuard AI`,
    html: `
      <h2>Team Invitation</h2>
      <p>You've been invited to join <strong>${workspaceName}</strong> on WriteGuard AI.</p>
      <p><a href="${inviteUrl}">Accept invitation</a></p>
    `,
  });

  return { ok: true };
}
