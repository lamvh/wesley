import { readFileSync } from "node:fs";
import pg from "pg";

function readEnv(key: string): string | undefined {
  const raw = readFileSync("/Users/lamvh/src/wesley/.env.local", "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith(`${key}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

async function main() {
  const url = readEnv("DIRECT_URL") ?? readEnv("DATABASE_URL");
  if (!url) throw new Error("DIRECT_URL / DATABASE_URL missing in .env.local");
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(
    `select column_name from information_schema.columns where table_schema='public' and table_name='staff' order by column_name`
  );
  console.log(res.rows.map((r) => r.column_name).join("\n"));
  await client.end();
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
