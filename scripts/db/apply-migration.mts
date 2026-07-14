/**
 * Applies a single SQL migration file against the Supabase Postgres DB.
 * Run: npx tsx scripts/db/apply-migration.mts supabase/migrations/0006_roster_shifts.sql
 * Connects with DIRECT_URL (fallback DATABASE_URL) from .env.local. Migration
 * DDL is written idempotently (create table if not exists / drop policy if
 * exists) so re-running is safe.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, isAbsolute } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function readEnv(key: string): string | undefined {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith(`${key}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

function pgConfig() {
  const url = readEnv("DIRECT_URL") ?? readEnv("DATABASE_URL");
  if (!url) throw new Error("DIRECT_URL / DATABASE_URL missing in .env.local");
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/?]+)(?::(\d+))?\/([^?]+)/);
  if (!m) throw new Error("Could not parse DIRECT_URL / DATABASE_URL");
  const [, user, urlPw, host, port, database] = m;
  return {
    user, password: readEnv("SUPABASE_DB_PASSWORD") ?? urlPw, host,
    port: port ? Number(port) : 5432, database, ssl: { rejectUnauthorized: false as const },
  };
}

async function main() {
  const rel = process.argv[2];
  if (!rel) throw new Error("Usage: apply-migration.mts <path-to-migration.sql>");
  const path = isAbsolute(rel) ? rel : join(root, rel);
  const ddl = readFileSync(path, "utf8");

  const client = new pg.Client(pgConfig());
  await client.connect();
  try {
    await client.query(ddl);
    console.log(`Applied ${rel}`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
