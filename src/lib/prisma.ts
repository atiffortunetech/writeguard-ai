import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = globalForPrisma.pool ?? new Pool({ connectionString });
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;
  }
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  const hasBrandImage =
    existing &&
    typeof (existing as PrismaClient & { brandImage?: { findMany?: unknown } })
      .brandImage?.findMany === "function";
  if (hasBrandImage) {
    return existing;
  }
  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();
