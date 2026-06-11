import type { ActivityType } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function logActivity(params: {
  userId: string;
  type: ActivityType;
  description: string;
  workspaceId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({ data: params });
}
