/**
 * Reads staff data directly via pg (no RLS session — mirrors seed-staff.mts's
 * connection pattern since no VERIFY_EMAIL/VERIFY_PASSWORD owner account is
 * configured in .env.local yet). Run: npx tsx scripts/db/verify-staff-read.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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
  return { user, password: readEnv("SUPABASE_DB_PASSWORD") ?? urlPw, host,
    port: port ? Number(port) : 5432, database, ssl: { rejectUnauthorized: false as const } };
}

async function main() {
  const client = new pg.Client(pgConfig());
  await client.connect();

  for (const t of ["staff", "shift_templates", "leave_requests"]) {
    const { rows } = await client.query(`select count(*) from public.${t}`);
    console.log(`✓ ${t}: ${rows[0].count} rows`);
  }

  const joinCheck = await client.query(
    `select l.type, s.name from public.leave_requests l join public.staff s on s.id = l.staff_id limit 1`,
  );
  console.log("✓ leave_request+staff join ok:", JSON.stringify(joinCheck.rows[0]));

  await client.end();
  console.log("✓ PASS — staff reads work");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
