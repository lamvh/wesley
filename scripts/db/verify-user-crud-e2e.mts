/**
 * Runs the user-CRUD verify scripts in sequence: soft-delete schema, update /
 * soft-delete / recover mechanics, and login-block for removed accounts.
 * Run: npx tsx scripts/db/verify-user-crud-e2e.mts
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const steps = [
  "verify-app-users-soft-delete.mts",
  "verify-user-crud.mts",
  "verify-deleted-user-login-blocked.mts",
];
for (const s of steps) {
  const r = spawnSync("npx", ["tsx", join(here, s)], { stdio: "inherit" });
  if (r.status !== 0) { console.error(`✗ FAIL at ${s}`); process.exit(1); }
}
console.log("✓ PASS - user CRUD (update, soft-delete, recover, login-block) verified");
