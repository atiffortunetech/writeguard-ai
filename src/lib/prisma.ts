import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function isSupabaseUrl(connectionString: string): boolean {
  return (
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com")
  );
}

function createPool(connectionString: string): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ...(isSupabaseUrl(connectionString)
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  });

  globalForPrisma.pool = pool;
  return pool;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = createPool(connectionString);
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** Lazy proxy — importing this module does not connect to the database. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
