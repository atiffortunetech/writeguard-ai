import { randomUUID } from "crypto";
import mysql, {
  type Pool,
  type PoolOptions,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

let pool: Pool | null = null;

/** Strip whitespace and optional surrounding quotes from Hostinger env values */
export function cleanEnv(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

/** Node may resolve localhost to IPv6 ::1; MySQL users on Hostinger are often only allowed on 127.0.0.1 */
function normalizeMysqlHost(host: string): string {
  const h = host.trim().toLowerCase();
  if (h === "localhost") return "127.0.0.1";
  return host.trim();
}

function parseDatabaseUrl(url: string): PoolOptions {
  const parsed = new URL(url);
  return {
    host: normalizeMysqlHost(parsed.hostname),
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

export type DbConfigSource =
  | "DATABASE_URL"
  | "MYSQL_*"
  | "DB_* (Hostinger)"
  | "none";

export function getDbConfigSource(): DbConfigSource {
  const databaseUrl = cleanEnv(process.env.DATABASE_URL);
  if (databaseUrl?.startsWith("mysql://")) return "DATABASE_URL";

  const mysqlHost = cleanEnv(process.env.MYSQL_HOST);
  const mysqlUser = cleanEnv(process.env.MYSQL_USER);
  if (mysqlHost && mysqlUser) return "MYSQL_*";

  const dbHost = cleanEnv(process.env.DB_HOST);
  const dbUser = cleanEnv(process.env.DB_USER);
  if (dbHost && dbUser) return "DB_* (Hostinger)";

  return "none";
}

/** Safe summary for health checks — never exposes password */
export function getDbConfigSummary() {
  const source = getDbConfigSource();
  const config = getPoolConfigSafe();
  return {
    source,
    host: config?.host ?? null,
    port: config?.port ?? 3306,
    user: config?.user ?? null,
    database: config?.database ?? null,
    passwordSet: Boolean(config?.password && config.password.length > 0),
    passwordLength: config?.password?.length ?? 0,
    hasStalePostgresUrl:
      cleanEnv(process.env.DATABASE_URL)?.startsWith("postgresql://") ?? false,
    hasConflictingUrls:
      Boolean(cleanEnv(process.env.DATABASE_URL)?.startsWith("mysql://")) &&
      Boolean(cleanEnv(process.env.MYSQL_HOST) || cleanEnv(process.env.DB_HOST)),
  };
}

function getPoolConfigSafe(): PoolOptions | null {
  try {
    return getPoolConfig();
  } catch {
    return null;
  }
}

function getPoolConfig(): PoolOptions {
  const databaseUrl = cleanEnv(process.env.DATABASE_URL);

  if (databaseUrl) {
    if (
      databaseUrl.startsWith("postgresql://") ||
      databaseUrl.startsWith("postgres://")
    ) {
      throw new Error(
        "DATABASE_URL is still PostgreSQL/Supabase. Delete it on Hostinger and use MYSQL_* or DB_* vars."
      );
    }
    if (databaseUrl.startsWith("mysql://")) {
      return parseDatabaseUrl(databaseUrl);
    }
  }

  // Hostinger official names: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
  const host =
    cleanEnv(process.env.MYSQL_HOST) ?? cleanEnv(process.env.DB_HOST);
  const user =
    cleanEnv(process.env.MYSQL_USER) ?? cleanEnv(process.env.DB_USER);
  const password =
    cleanEnv(process.env.MYSQL_PASSWORD) ?? cleanEnv(process.env.DB_PASSWORD);
  const database =
    cleanEnv(process.env.MYSQL_DATABASE) ?? cleanEnv(process.env.DB_NAME);
  const port =
    cleanEnv(process.env.MYSQL_PORT) ?? cleanEnv(process.env.DB_PORT);

  if (!host || !user || password === undefined || !database) {
    throw new Error(
      "Database not configured. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE — or Hostinger's DB_HOST, DB_USER, DB_PASSWORD, DB_NAME."
    );
  }

  const options: PoolOptions = {
    host: normalizeMysqlHost(host),
    port: port ? Number(port) : 3306,
    user,
    password,
    database,
  };

  const socketPath = cleanEnv(process.env.MYSQL_SOCKET);
  if (socketPath) {
    options.socketPath = socketPath;
  }

  return options;
}

export function getPool(): Pool {
  if (!pool) {
    const config = getPoolConfig();
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 10_000,
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
