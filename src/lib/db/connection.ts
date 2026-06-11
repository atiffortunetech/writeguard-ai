import { randomUUID } from "crypto";
import mysql, {
  type Pool,
  type PoolOptions,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

let pool: Pool | null = null;

function parseDatabaseUrl(url: string): PoolOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

function getPoolConfig(): PoolOptions {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    if (
      databaseUrl.startsWith("postgresql://") ||
      databaseUrl.startsWith("postgres://")
    ) {
      throw new Error(
        "DATABASE_URL is still PostgreSQL/Supabase. On Hostinger, delete it and set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (or DATABASE_URL=mysql://...)."
      );
    }
    if (databaseUrl.startsWith("mysql://")) {
      return parseDatabaseUrl(databaseUrl);
    }
  }

  const host = process.env.MYSQL_HOST?.trim();
  const user = process.env.MYSQL_USER?.trim();
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE?.trim();

  if (!host || !user || password === undefined || password === "" || !database) {
    throw new Error(
      "Database not configured. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE on Hostinger (host is usually localhost or 127.0.0.1)."
    );
  }

  return {
    host,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user,
    password,
    database,
  };
}

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      ...getPoolConfig(),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: false,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

export type QueryParam = string | number | boolean | Date | null | Buffer;

export async function query<T>(sql: string, params: QueryParam[] = []): Promise<T[]> {
  const [rows] = await getPool().execute<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function queryOne<T>(sql: string, params: QueryParam[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: QueryParam[] = []): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}

export function newId(): string {
  return randomUUID();
}

export function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function toJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}
