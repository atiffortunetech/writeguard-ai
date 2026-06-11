import dotenv from "dotenv";
import pg from "pg";
import { readFileSync } from "fs";
import path from "path";

// Prefer pooler URL from .env over a stale shell DATABASE_URL (often DIRECT_URL)
dotenv.config({ override: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log("Checking BrandImage setup...\n");

  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'BrandImage'
    ) AS exists
  `);

  if (!tableCheck.rows[0]?.exists) {
    console.log("BrandImage table not found — creating...");
    const sql = readFileSync(
      path.join(process.cwd(), "prisma/migrations/brand-image-manual.sql"),
      "utf8"
    );
    // Run each statement (skip comments-only lines)
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    for (const stmt of statements) {
      if (stmt.startsWith("DO $$")) {
        await pool.query(stmt + ";");
      } else if (stmt.length > 5) {
        await pool.query(stmt);
      }
    }
    console.log("BrandImage table created.");
  } else {
    console.log("BrandImage table: OK");
  }

  // Add ActivityType enum value if missing
  try {
    const enumCheck = await pool.query(`
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'ActivityType' AND e.enumlabel = 'BRAND_IMAGE_GENERATED'
    `);
    if (enumCheck.rowCount === 0) {
      await pool.query(
        `ALTER TYPE "ActivityType" ADD VALUE 'BRAND_IMAGE_GENERATED'`
      );
      console.log("ActivityType enum: added BRAND_IMAGE_GENERATED");
    } else {
      console.log("ActivityType enum: OK");
    }
  } catch (e) {
    console.warn("ActivityType enum update skipped:", e instanceof Error ? e.message : e);
  }

  for (const col of ["referenceImageUrl", "referenceStoragePath"]) {
    const colCheck = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'BrandImage' AND column_name = $1`,
      [col]
    );
    if (colCheck.rowCount === 0) {
      await pool.query(`ALTER TABLE "BrandImage" ADD COLUMN "${col}" TEXT`);
      console.log(`BrandImage column added: ${col}`);
    }
  }

  const count = await pool.query(`SELECT COUNT(*)::int AS n FROM "BrandImage"`);
  console.log(`BrandImage rows: ${count.rows[0]?.n ?? 0}`);
  console.log("\nDone. Restart dev server: npm run dev");
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
