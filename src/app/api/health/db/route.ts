import {
  getDbConfigSummary,
  getPool,
  queryOne,
} from "@/lib/db/connection";

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
  const config = getDbConfigSummary();

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
      config,
      tables: {
        users: Boolean(usersTable),
        plans: Boolean(plansTable),
      },
    });
  } catch (err) {
    console.error("Database health check failed:", err);
    const message = err instanceof Error ? err.message : "Unknown database error";

    let hint: string | undefined;
    if (config.hasStalePostgresUrl) {
      hint = "Delete the old PostgreSQL DATABASE_URL from Hostinger env vars.";
    } else if (config.hasConflictingUrls) {
      hint =
        "You have both DATABASE_URL and MYSQL_* set. Remove DATABASE_URL or fix its password — it overrides MYSQL_*.";
    } else if (message.includes("Access denied")) {
      hint =
        "Password rejected by MySQL. In Hostinger → Databases → reset the MySQL user password, paste the NEW password into MYSQL_PASSWORD (no quotes), then Restart the app.";
    } else if (message.includes("timed out") || message.includes("ETIMEDOUT")) {
      hint = "Try MYSQL_HOST=127.0.0.1 and restart the Node.js app from Hostinger.";
    } else if (message.includes("ECONNREFUSED")) {
      hint = "MySQL not reachable. Confirm MYSQL_HOST=127.0.0.1 and restart the app.";
    } else if (message.includes("Unknown database")) {
      hint = "Wrong MYSQL_DATABASE name. Must match exactly (e.g. u998538981_writeguard).";
    }

    return Response.json(
      {
        ok: false,
        database: "error",
        message,
        config,
        hint,
      },
      { status: 503 }
    );
  }
}
