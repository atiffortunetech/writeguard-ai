import { Pool } from "pg";

function isSupabaseUrl(connectionString: string): boolean {
  return (
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com")
  );
}

export async function GET() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return Response.json(
      {
        ok: false,
        database: "error",
        message: "DATABASE_URL is not set on the server",
      },
      { status: 503 }
    );
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 8_000,
    ...(isSupabaseUrl(connectionString)
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  });

  try {
    await pool.query("SELECT 1");
    return Response.json({ ok: true, database: "connected" });
  } catch (err) {
    console.error("Database health check failed:", err);
    return Response.json(
      {
        ok: false,
        database: "error",
        message: err instanceof Error ? err.message : "Unknown database error",
      },
      { status: 503 }
    );
  } finally {
    await pool.end().catch(() => undefined);
  }
}
