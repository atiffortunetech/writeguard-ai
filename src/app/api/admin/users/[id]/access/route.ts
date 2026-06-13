import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAdmin, apiError } from "@/lib/api-utils";
import { findUserById, upsertUserAccess } from "@/lib/db";
import type { PlanTier, ToolsAccessMode } from "@/types/database";

const updateAccessSchema = z.object({
  creditLimit: z.number().int().min(-1).nullable().optional(),
  toolsMode: z.enum(["locked", "all", "plan", "tier"]).optional(),
  featureTier: z.enum(["FREE", "PRO", "BUSINESS", "ENTERPRISE"]).nullable().optional(),
  adminNotes: z.string().max(2000).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const user = await findUserById(id);
  if (!user) return apiError("User not found", 404);

  const { findUserAccess } = await import("@/lib/db");
  const { getUserCreditPolicy } = await import("@/lib/usage");
  const { formatCreditLimitDisplay, formatToolsModeDisplay } = await import(
    "@/lib/access-control"
  );

  const [access, policy] = await Promise.all([
    findUserAccess(id),
    getUserCreditPolicy(id),
  ]);

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    access,
    policy: {
      ...policy,
      creditLimitLabel: formatCreditLimitDisplay(policy.creditLimit),
      toolsModeLabel: formatToolsModeDisplay(policy.toolsMode),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const target = await findUserById(id);
  if (!target) return apiError("User not found", 404);
  if (target.role === "ADMIN") {
    return apiError("Cannot modify access for admin accounts", 400);
  }

  const body = await req.json();
  const parsed = updateAccessSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  if (parsed.data.toolsMode === "tier" && parsed.data.featureTier === undefined) {
    return apiError("featureTier is required when toolsMode is tier", 400);
  }

  try {
    const access = await upsertUserAccess({
      userId: id,
      creditLimit: parsed.data.creditLimit,
      toolsMode: parsed.data.toolsMode as ToolsAccessMode | undefined,
      featureTier: parsed.data.featureTier as PlanTier | null | undefined,
      adminNotes: parsed.data.adminNotes,
      grantedById: auth.session.user.id,
      expiresAt:
        parsed.data.expiresAt === undefined
          ? undefined
          : parsed.data.expiresAt
            ? new Date(parsed.data.expiresAt)
            : null,
    });

    return Response.json({ success: true, access });
  } catch (err) {
    console.error("Update user access error:", err);
    const message = err instanceof Error ? err.message : "Failed to update access";
    if (message.includes("user_access") || message.includes("Unknown table")) {
      return apiError(
        "user_access table missing. Import mysql/user-access-migration.sql in phpMyAdmin.",
        503
      );
    }
    return apiError(message, 500);
  }
}

/** Quick presets */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const target = await findUserById(id);
  if (!target) return apiError("User not found", 404);
  if (target.role === "ADMIN") {
    return apiError("Cannot modify access for admin accounts", 400);
  }

  const { preset, creditLimit, featureTier, adminNotes } = await req.json();

  let payload: Parameters<typeof upsertUserAccess>[0] = {
    userId: id,
    grantedById: auth.session.user.id,
    adminNotes: adminNotes ?? null,
  };

  switch (preset) {
    case "lock":
      payload = {
        ...payload,
        creditLimit: 0,
        toolsMode: "locked",
        featureTier: null,
        adminNotes: adminNotes ?? "Locked by admin",
      };
      break;
    case "grant_all":
      payload = {
        ...payload,
        creditLimit: -1,
        toolsMode: "all",
        featureTier: null,
        adminNotes: adminNotes ?? "Full access granted by admin",
      };
      break;
    case "grant_custom":
      if (typeof creditLimit !== "number" || creditLimit < -1) {
        return apiError("creditLimit required (-1 for unlimited, or positive number)", 400);
      }
      payload = {
        ...payload,
        creditLimit,
        toolsMode: "all",
        featureTier: null,
        adminNotes: adminNotes ?? `Custom ${creditLimit === -1 ? "unlimited" : creditLimit} credits`,
      };
      break;
    case "follow_plan":
      payload = {
        ...payload,
        creditLimit: null,
        toolsMode: "plan",
        featureTier: null,
        adminNotes: adminNotes ?? "Follows Stripe/billing plan",
      };
      break;
    case "tier":
      if (!featureTier) return apiError("featureTier required", 400);
      payload = {
        ...payload,
        creditLimit: creditLimit ?? null,
        toolsMode: "tier",
        featureTier,
        adminNotes: adminNotes ?? `Tier access: ${featureTier}`,
      };
      break;
    default:
      return apiError("Invalid preset. Use: lock, grant_all, grant_custom, follow_plan, tier", 400);
  }

  try {
    const access = await upsertUserAccess(payload);
    return Response.json({ success: true, access });
  } catch (err) {
    console.error("Preset user access error:", err);
    return apiError("Failed to update access. Run mysql/user-access-migration.sql first.", 503);
  }
}
