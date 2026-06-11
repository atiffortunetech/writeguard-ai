import type { Feedback, User } from "@/types/database";
import { execute, newId, query, queryOne } from "./connection";

type FeedbackRow = {
  id: string;
  user_id: string;
  rating: number | null;
  message: string;
  page: string | null;
  created_at: Date;
};

function mapFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    userId: row.user_id,
    rating: row.rating,
    message: row.message,
    page: row.page,
    createdAt: row.created_at,
  };
}

export type CreateFeedbackInput = {
  userId: string;
  rating?: number | null;
  message: string;
  page?: string | null;
};

export type FeedbackWithUser = Feedback & {
  user: Pick<User, "name" | "email">;
};

export async function createFeedback(data: CreateFeedbackInput): Promise<Feedback> {
  const id = newId();
  await execute(
    "INSERT INTO feedback (id, user_id, rating, message, page) VALUES (?, ?, ?, ?, ?)",
    [id, data.userId, data.rating ?? null, data.message, data.page ?? null]
  );
  const row = await queryOne<FeedbackRow>("SELECT * FROM feedback WHERE id = ?", [id]);
  if (!row) throw new Error("Failed to create feedback");
  return mapFeedback(row);
}

export async function listFeedback(options?: { limit?: number }): Promise<FeedbackWithUser[]> {
  const limit = options?.limit ?? 50;
  const rows = await query<FeedbackRow & { user_name: string | null; user_email: string }>(
    `SELECT f.*, u.name AS user_name, u.email AS user_email
     FROM feedback f
     INNER JOIN users u ON u.id = f.user_id
     ORDER BY f.created_at DESC
     LIMIT ?`,
    [limit]
  );

  return rows.map((row) => ({
    ...mapFeedback(row),
    user: {
      name: row.user_name,
      email: row.user_email,
    },
  }));
}

export async function listFeedbackByUserId(userId: string): Promise<Feedback[]> {
  const rows = await query<FeedbackRow>(
    "SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows.map(mapFeedback);
}
