import { getPool, queryOne } from "@/lib/db/connection";

const TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Database query timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function GET() {
  try {
    const pool = getPool();
    await withTimeout(pool.query("SELECT 1"), TIMEOUT_MS);

    const usersTable = await withTimeout(
      queryOne<{ name: string }>(
        "SELECT TABLE_NAME AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users' LIMIT 1"
      ),
      TIMEOUT_MS
    );

    const plansTable = await withTimeout(
      queryOne<{ name: string }>(
        "SELECT TABLE_NAME AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'plans' LIMIT 1"
      ),
      TIMEOUT_MS
    );

    return Response.json({
      ok: true,
      database: "connected",
      tables: {
        users: Boolean(usersTable),
        plans: Boolean(plansTable),
      },
    });
  } catch (err) {
    console.error("Database health check failed:", err);
    const message = err instanceof Error ? err.message : "Unknown database error";
    return Response.json(
      {
        ok: false,
        database: "error",
        message,
        hint:
          message.includes("timed out") || message.includes("ETIMEDOUT")
            ? "Wrong MYSQL_HOST on Hostinger. Try 127.0.0.1 or the hostname from Databases → Details (not localhost)."
            : message.includes("doesn't exist") || message.includes("Unknown table")
              ? "Import mysql/writeguard-full-setup.sql in phpMyAdmin."
              : message.includes("Access denied")
                ? "Wrong MYSQL_PASSWORD, or set MYSQL_HOST=127.0.0.1 (not localhost — avoids IPv6 ::1)."
                : undefined,
      },
      { status: 503 }
    );
  }
}
