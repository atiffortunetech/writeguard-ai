export async function GET() {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const dbType = databaseUrl.startsWith("mysql://")
    ? "mysql-url"
    : databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")
      ? "postgresql-stale"
      : databaseUrl
        ? "unknown-url"
        : "none";

  return Response.json({
    ok: true,
    app: "running",
    database: {
      configured:
        dbType === "mysql-url" ||
        Boolean(
          process.env.MYSQL_HOST &&
            process.env.MYSQL_USER &&
            process.env.MYSQL_PASSWORD &&
            process.env.MYSQL_DATABASE
        ),
      mode:
        dbType === "mysql-url"
          ? "DATABASE_URL (mysql)"
          : process.env.MYSQL_HOST
            ? "MYSQL_* vars"
            : dbType === "postgresql-stale"
              ? "ERROR: still PostgreSQL — update env vars"
              : "not configured",
    },
    hasAuthSecret: Boolean(
      process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
    ),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
