export async function GET() {
  return Response.json({
    ok: true,
    app: "running",
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasAuthSecret: Boolean(
      process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
    ),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
