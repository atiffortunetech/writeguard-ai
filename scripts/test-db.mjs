import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString });

try {
  const pg = await pool.query(
    `SELECT email FROM "User" WHERE email = $1 LIMIT 1`,
    ["atiffortunetech@gmail.com"]
  );
  console.log("pg direct:", pg.rows[0] ?? "no user");

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const user = await prisma.user.findUnique({
    where: { email: "atiffortunetech@gmail.com" },
    select: { email: true, passwordHash: true, banned: true },
  });
  console.log("prisma:", {
    email: user?.email,
    hasPassword: Boolean(user?.passwordHash),
    banned: user?.banned,
  });
  await prisma.$disconnect();
} catch (err) {
  console.error("FAIL:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
