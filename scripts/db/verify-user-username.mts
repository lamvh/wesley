/**
 * Verifies the app_users username/email schema: username exists (not null,
 * unique) and email is nullable. Run: npx tsx scripts/db/verify-user-username.mts
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
      `select column_name, is_nullable from information_schema.columns
       where table_schema='public' and table_name='app_users'
         and column_name in ('username','email')`,
    );
    const username = rows.find((r) => r.column_name === "username");
    const email = rows.find((r) => r.column_name === "email");
    if (!username) throw new Error("FAIL: app_users.username missing");
    if (username.is_nullable !== "NO") throw new Error("FAIL: username must be NOT NULL");
    if (!email || email.is_nullable !== "YES") throw new Error("FAIL: email must be nullable");
    console.log("✓ PASS - username NOT NULL present, email nullable");
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
