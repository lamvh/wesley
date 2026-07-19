/**
 * Verifies the roster_on_call table exists with the expected columns.
 * Run: npx tsx scripts/db/verify-roster-on-call-table.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};

function pgConfig() {
  const url = env("DIRECT_URL") ?? env("DATABASE_URL");
  if (!url) throw new Error("DIRECT_URL / DATABASE_URL missing in .env.local");
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/?]+)(?::(\d+))?\/([^?]+)/);
  if (!m) throw new Error("Could not parse DB URL");
  const [, user, urlPw, host, port, database] = m;
  return { user, password: env("SUPABASE_DB_PASSWORD") ?? urlPw, host,
    port: port ? Number(port) : 5432, database, ssl: { rejectUnauthorized: false as const } };
}

async function main() {
  const client = new pg.Client(pgConfig());
  await client.connect();
  try {
    const { rows } = await client.query(
      `select column_name from information_schema.columns
       where table_schema='public' and table_name='roster_on_call'`,
    );
    const cols = new Set(rows.map((r) => r.column_name));
    for (const c of ["building_id", "on_call_date", "staff_id"]) {
      if (!cols.has(c)) throw new Error(`FAIL: roster_on_call.${c} missing`);
    }
    console.log("✓ PASS - roster_on_call table present with expected columns");
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
