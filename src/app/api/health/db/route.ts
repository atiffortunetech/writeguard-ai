import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, database: "connected" });
  } catch (err) {
    console.error("Database health check failed:", err);
    return Response.json(
      {
        ok: false,
        database: "error",
        message: err instanceof Error ? err.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}
