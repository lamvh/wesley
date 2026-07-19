// Pure helpers for login identifiers. Username is the required login handle;
// email is an optional second identifier. When a user has no real email, their
// Supabase auth.users row uses a synthetic address under this reserved domain
// so the account can exist without a routable mailbox.
export const AUTH_EMAIL_DOMAIN = "no-email.wesley.internal";

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
const RESERVED = new Set(["admin", "root", "system", "support"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

// Returns a human message when invalid, or null when the username is acceptable.
export function validateUsername(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (u.length < 3 || u.length > 30) return "Username phải dài 3–30 ký tự.";
  if (!USERNAME_RE.test(u)) return "Username chỉ gồm chữ thường, số và . _ -";
  if (RESERVED.has(u)) return "Username này đã được giữ chỗ, chọn tên khác.";
  return null;
}

export function isValidEmail(raw: string): boolean {
  return EMAIL_RE.test(raw.trim());
}

export function syntheticAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

// The email Supabase Auth signs the person in with: their real email when set,
// otherwise the deterministic synthetic address.
export function resolveAuthEmail(row: { username: string; email: string | null }): string {
  return row.email ?? syntheticAuthEmail(row.username);
}
