import { getPool } from "@/lib/db/connection";

export async function GET() {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return Response.json({ ok: true, database: "connected" });
  } catch (err) {
    console.error("Database health check failed:", err);
    const message = err instanceof Error ? err.message : "Unknown database error";
    return Response.json(
      {
        ok: false,
        database: "error",
        message,
        hint: message.includes("not configured")
          ? "Set DATABASE_URL=mysql://... or MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE on Hostinger"
          : undefined,
      },
      { status: 503 }
    );
  }
}
