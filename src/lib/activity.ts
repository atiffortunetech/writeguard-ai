import { createActivityLog } from "@/lib/db";
import type { ActivityType } from "@/types/database";

export async function logActivity(params: {
  userId: string;
  type: ActivityType;
  description: string;
  workspaceId?: string;
  metadata?: Record<string, unknown> | null;
}) {
  await createActivityLog(params);
}
