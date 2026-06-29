import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";
import { logger } from "../config/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const LOCK_ID = 123456789; // Stable advisory lock ID

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query("SELECT filename FROM schema_migrations ORDER BY id");
  return new Set(result.rows.map((r: { filename: string }) => r.filename));
}

async function getMigrationFiles(): Promise<string[]> {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  return files;
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // Acquire advisory lock
    await client.query(`SELECT pg_advisory_lock($1)`, [LOCK_ID]);
    logger.info("Acquired migration advisory lock");

    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const files = await getMigrationFiles();
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      logger.info("No pending migrations");
      return;
    }

    logger.info({ count: pending.length }, "Running pending migrations");

    for (const filename of pending) {
      const filepath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(filepath, "utf-8");

      logger.info({ migration: filename }, "Applying migration");

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
        await client.query("COMMIT");
        logger.info({ migration: filename }, "Migration applied successfully");
      } catch (err) {
        await client.query("ROLLBACK");
        logger.error({ migration: filename, err }, "Migration failed");
        throw err;
      }
    }

    logger.info("All migrations applied successfully");
  } finally {
    // Release advisory lock
    await client.query(`SELECT pg_advisory_unlock($1)`, [LOCK_ID]);
    logger.info("Released migration advisory lock");
    client.release();
  }
}
