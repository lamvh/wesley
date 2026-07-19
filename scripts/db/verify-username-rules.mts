/**
 * Unit-checks the pure username/email helpers (no DB).
 * Run: npx tsx scripts/db/verify-username-rules.mts
 */
import {
  normalizeUsername, validateUsername, isValidEmail,
  syntheticAuthEmail, resolveAuthEmail, AUTH_EMAIL_DOMAIN,
} from "../../src/lib/validation/username";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

assert(normalizeUsername("  Anahera_W ") === "anahera_w", "normalize trims + lowercases");
assert(validateUsername("ab") !== null, "too short rejected");
assert(validateUsername("has space") !== null, "space rejected");
assert(validateUsername("has@at") !== null, "@ rejected");
assert(validateUsername("admin") !== null, "reserved rejected");
assert(validateUsername("anahera.w-1") === null, "valid accepted");
assert(isValidEmail("a@b.co") === true, "valid email");
assert(isValidEmail("nope") === false, "invalid email");
assert(syntheticAuthEmail("jo") === `jo@${AUTH_EMAIL_DOMAIN}`, "synthetic email");
assert(resolveAuthEmail({ username: "jo", email: null }) === `jo@${AUTH_EMAIL_DOMAIN}`, "resolve → synthetic when no email");
assert(resolveAuthEmail({ username: "jo", email: "real@x.co" }) === "real@x.co", "resolve → real email");
console.log("✓ PASS - username/email helpers");
