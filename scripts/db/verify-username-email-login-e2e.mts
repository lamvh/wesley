/**
 * Aggregate end-to-end check: schema + create-account + identifier login.
 * Runs the three scenario scripts in sequence and fails on the first error.
 * Run: npx tsx scripts/db/verify-username-email-login-e2e.mts
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const steps = [
  "verify-user-username.mts",
  "verify-username-rules.mts",
  "verify-create-user.mts",
  "verify-identifier-login.mts",
];

for (const s of steps) {
  const r = spawnSync("npx", ["tsx", join(here, s)], { stdio: "inherit" });
  if (r.status !== 0) { console.error(`✗ FAIL at ${s}`); process.exit(1); }
}
console.log("✓ PASS - full username/email login chain verified");
