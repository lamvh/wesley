# Username + Email Login (email optional) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin tạo tài khoản với username bắt buộc + email tùy chọn; người dùng đăng nhập bằng username **hoặc** email + mật khẩu.

**Architecture:** Supabase Auth luôn cần một email trong `auth.users`; khi không có email thật, dùng email tổng hợp `<username>@no-email.wesley.internal`. User chưa đăng nhập là anonymous nên không đọc được `app_users` (RLS) — vì vậy việc phân giải identifier→email đăng nhập làm ở **server action** dùng service-role, rồi gọi `signInWithPassword` trên SSR server client để set cookie session. Vì mapping identifier→email là **tất định** (`email ?? synthetic(username)`), server action tự suy ra email đăng nhập, không cần gọi `getUserById`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), `@supabase/ssr` + `@supabase/supabase-js`, Postgres (Supabase), `pg` + `tsx` cho migration/verify scripts, shadcn/ui + Tailwind.

## Global Constraints

- **Spec nguồn:** `docs/superpowers/specs/2026-07-20-username-email-login-design.md`.
- **Giữ invite-only** — không tạo trang đăng ký công khai.
- **Service-role chỉ ở server** — không bao giờ đặt tên biến `NEXT_PUBLIC_` cho `SUPABASE_SERVICE_ROLE_KEY`; không import `src/lib/supabase/admin.ts` vào bất kỳ client component nào (`"use client"`).
- **Email tổng hợp** dùng đúng domain hằng số: `no-email.wesley.internal`.
- **Username:** `^[a-z0-9._-]{3,30}$`, chuẩn hóa lowercase, unique (citext), reserved = `admin|root|system|support`.
- **Password:** tối thiểu 8 ký tự.
- **Lỗi đăng nhập đồng nhất:** username không tồn tại HAY sai mật khẩu → cùng một thông điệp `"Sai thông tin đăng nhập."` (chống liệt kê tài khoản).
- **Comment/tên file không tham chiếu plan/phase** (theo quy tắc dự án).
- **Git:** theo quy tắc dự án, **KHÔNG tự commit** trừ khi người dùng yêu cầu. Bước "Commit" cuối mỗi task = stage sẵn; để người dùng quyết định commit. Nếu người dùng đã cho phép commit, dùng conventional commits (`feat:`/`fix:`).
- **Migration/verify chạy:** `npx tsx scripts/db/<script>.mts` (đọc `.env.local`).

---

### Task 1: Migration schema — thêm `username`, bỏ `NOT NULL` cho `email`

**Files:**
- Create: `supabase/migrations/0014_user_username.sql`
- Create (verify): `scripts/db/verify-user-username.mts`

**Interfaces:**
- Produces: cột `public.app_users.username citext unique not null`; `public.app_users.email` trở thành nullable (unique giữ nguyên).

- [ ] **Step 1: Viết verify script (kiểm tra schema) — sẽ FAIL trước migration**

Create `scripts/db/verify-user-username.mts`:

```ts
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
```

- [ ] **Step 2: Chạy verify để xác nhận FAIL**

Run: `npx tsx scripts/db/verify-user-username.mts`
Expected: FAIL với `"app_users.username missing"` (cột chưa tồn tại).

- [ ] **Step 3: Viết migration**

Create `supabase/migrations/0014_user_username.sql`:

```sql
-- Adds a required login username to app_users and makes the contact email
-- optional. Idempotent so it can be re-run safely. Username is citext so
-- comparisons are case-insensitive; the unique index enforces one per person.
alter table public.app_users
  add column if not exists username citext unique;

-- Contact email becomes optional (login can be by username alone). The unique
-- index still holds; Postgres allows many NULLs under a unique constraint.
alter table public.app_users
  alter column email drop not null;

-- Backfill username for existing rows from the local part of their email, then
-- enforce NOT NULL. Existing rows all have an email today, so this is safe.
update public.app_users
  set username = split_part(email::text, '@', 1)
  where username is null and email is not null;

alter table public.app_users
  alter column username set not null;
```

- [ ] **Step 4: Áp migration**

Run: `npx tsx scripts/db/apply-migration.mts supabase/migrations/0014_user_username.sql`
Expected: `Applied supabase/migrations/0014_user_username.sql`

- [ ] **Step 5: Chạy verify để xác nhận PASS**

Run: `npx tsx scripts/db/verify-user-username.mts`
Expected: `✓ PASS - username NOT NULL present, email nullable`

- [ ] **Step 6: Commit (stage sẵn; commit nếu được phép)**

```bash
git add supabase/migrations/0014_user_username.sql scripts/db/verify-user-username.mts
git commit -m "feat: add username column and make email optional on app_users"
```

---

### Task 2: Service-role client + username validation helpers

**Files:**
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/validation/username.ts`
- Create (verify): `scripts/db/verify-username-rules.mts`

**Interfaces:**
- Produces (`admin.ts`): `createAdminClient(): SupabaseClient` — service-role client, `persistSession:false`, không dùng cookies.
- Produces (`username.ts`):
  - `AUTH_EMAIL_DOMAIN = "no-email.wesley.internal"`
  - `normalizeUsername(raw: string): string`
  - `validateUsername(raw: string): string | null` (trả message lỗi, hoặc null nếu hợp lệ)
  - `isValidEmail(raw: string): boolean`
  - `syntheticAuthEmail(username: string): string`
  - `resolveAuthEmail(row: { username: string; email: string | null }): string`

- [ ] **Step 1: Viết verify script cho quy tắc username — FAIL trước khi tạo file**

Create `scripts/db/verify-username-rules.mts`:

```ts
/**
 * Unit-checks the pure username/email helpers (no DB).
 * Run: npx tsx scripts/db/verify-username-rules.mts
 */
import {
  normalizeUsername, validateUsername, isValidEmail,
  syntheticAuthEmail, resolveAuthEmail, AUTH_EMAIL_DOMAIN,
} from "../../src/lib/validation/username.ts";

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
```

- [ ] **Step 2: Chạy verify để xác nhận FAIL**

Run: `npx tsx scripts/db/verify-username-rules.mts`
Expected: FAIL (module `src/lib/validation/username.ts` chưa tồn tại).

- [ ] **Step 3: Viết `username.ts`**

Create `src/lib/validation/username.ts`:

```ts
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
```

- [ ] **Step 4: Viết `admin.ts`**

Create `src/lib/supabase/admin.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. Bypasses RLS - SERVER-ONLY. Never import this
// from a "use client" module. Used for admin user creation and for resolving a
// login identifier to an account before a session exists (anonymous users
// cannot read app_users under RLS).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase URL / service role key missing from server env");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
```

- [ ] **Step 5: Chạy verify để xác nhận PASS**

Run: `npx tsx scripts/db/verify-username-rules.mts`
Expected: `✓ PASS - username/email helpers`

- [ ] **Step 6: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/lib/supabase/admin.ts src/lib/validation/username.ts scripts/db/verify-username-rules.mts
git commit -m "feat: add service-role client and username validation helpers"
```

---

### Task 3: `createUser` server action (admin tạo tài khoản thật)

**Files:**
- Create: `src/lib/actions/users.ts`
- Create (verify): `scripts/db/verify-create-user.mts`

**Interfaces:**
- Consumes: `createAdminClient` (Task 2), `normalizeUsername`/`validateUsername`/`isValidEmail`/`syntheticAuthEmail` (Task 2).
- Produces:
  - `interface CreateUserState { error?: string; ok?: boolean }`
  - `createUser(_prev: CreateUserState, fd: FormData): Promise<CreateUserState>`
  - FormData keys: `name`, `username`, `email` (optional), `password`, `role`, `scope` (optional).

- [ ] **Step 1: Viết verify script — mô phỏng logic tạo tài khoản trực tiếp (FAIL trước)**

Create `scripts/db/verify-create-user.mts`:

```ts
/**
 * End-to-end check of the create-account mechanics against the real DB, mirroring
 * the createUser server action: username-only account gets a synthetic auth
 * email, the app_users row links to it, and orphan cleanup works. Cleans up
 * after itself. Run: npx tsx scripts/db/verify-create-user.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { syntheticAuthEmail } from "../../src/lib/validation/username.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n").find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};

const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const USERNAME = "verify_user_test";
const PASSWORD = "Verify-pass-123";

async function cleanup() {
  await admin.from("app_users").delete().eq("username", USERNAME);
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const u = list.data.users.find((x) => x.email === syntheticAuthEmail(USERNAME));
  if (u) await admin.auth.admin.deleteUser(u.id);
}

async function main() {
  await cleanup();
  const authEmail = syntheticAuthEmail(USERNAME);
  const created = await admin.auth.admin.createUser({
    email: authEmail, password: PASSWORD, email_confirm: true,
  });
  if (created.error) throw created.error;
  const authId = created.data.user!.id;

  const { error: insErr } = await admin.from("app_users").insert({
    auth_id: authId, username: USERNAME, email: null,
    name: "Verify User", role_id: "carer", building_id: "wesley", status: "Active",
  });
  if (insErr) { await admin.auth.admin.deleteUser(authId); throw insErr; }

  const { data } = await admin.from("app_users")
    .select("username, email, auth_id").eq("username", USERNAME).maybeSingle();
  if (!data || data.email !== null || data.auth_id !== authId) throw new Error("FAIL: row mismatch");
  console.log("✓ PASS - username-only account created with synthetic auth email");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
```

- [ ] **Step 2: Chạy verify để xác nhận FAIL**

Run: `npx tsx scripts/db/verify-create-user.mts`
Expected: FAIL (import `syntheticAuthEmail` OK từ Task 2, nhưng nếu Task 2 chưa xong sẽ lỗi module). Sau Task 2, script này PASS ngay cả trước khi viết `users.ts` — đây là verify cho **cơ chế DB/auth**, không phải cho action. Mục tiêu Step 2: xác nhận cơ chế chạy được trước khi bọc vào action.

Expected thực tế sau Task 2: `✓ PASS`. Nếu FAIL → sửa cơ chế trước khi viết action.

- [ ] **Step 3: Viết `createUser` action**

Create `src/lib/actions/users.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeUsername, validateUsername, isValidEmail, syntheticAuthEmail,
} from "@/lib/validation/username";

export interface CreateUserState { error?: string; ok?: boolean }

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// Admin-only: creates a Supabase Auth account (with an admin-set password) plus
// the linked app_users row. Username is required; email is optional. With no
// email, the auth account uses a synthetic address so it can exist mailbox-free.
export async function createUser(
  _prev: CreateUserState,
  fd: FormData,
): Promise<CreateUserState> {
  const name = str(fd, "name");
  const rawUsername = str(fd, "username");
  const rawEmail = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role");
  const scope = str(fd, "scope");

  if (!name) return { error: "Vui lòng nhập họ tên." };
  const usernameError = validateUsername(rawUsername);
  if (usernameError) return { error: usernameError };
  if (rawEmail && !isValidEmail(rawEmail)) return { error: "Email không hợp lệ." };
  if (password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự." };
  if (!role) return { error: "Vui lòng chọn vai trò." };

  const username = normalizeUsername(rawUsername);
  const email = rawEmail ? rawEmail.toLowerCase() : null;
  const authEmail = email ?? syntheticAuthEmail(username);

  const admin = createAdminClient();

  const created = await admin.auth.admin.createUser({
    email: authEmail, password, email_confirm: true,
    user_metadata: { name },
  });
  if (created.error) {
    // Most commonly a duplicate email at the auth layer.
    return { error: "Không tạo được tài khoản (email có thể đã tồn tại)." };
  }
  const authId = created.data.user!.id;

  const { error: insErr } = await admin.from("app_users").insert({
    auth_id: authId, username, email, name, role_id: role,
    building_id: "wesley", scope: scope || null, status: "Active",
  });
  if (insErr) {
    // Roll back the orphaned auth user so a retry can reuse the username/email.
    await admin.auth.admin.deleteUser(authId);
    // 23505 = unique_violation (username or email already taken).
    if (insErr.code === "23505") return { error: "Username hoặc email đã tồn tại." };
    return { error: "Không lưu được tài khoản, thử lại." };
  }

  revalidatePath("/portal/users");
  return { ok: true };
}
```

- [ ] **Step 4: Chạy lại verify cơ chế để xác nhận PASS**

Run: `npx tsx scripts/db/verify-create-user.mts`
Expected: `✓ PASS - username-only account created with synthetic auth email`

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/lib/actions/users.ts scripts/db/verify-create-user.mts
git commit -m "feat: add admin createUser action with username and optional email"
```

---

### Task 4: `signIn` server action (đăng nhập bằng username hoặc email)

**Files:**
- Create: `src/lib/actions/auth.ts`
- Create (verify): `scripts/db/verify-identifier-login.mts`

**Interfaces:**
- Consumes: `createAdminClient` (Task 2), `resolveAuthEmail`/`normalizeUsername` (Task 2), `createClient` from `src/lib/supabase/server.ts` (SSR, đã có).
- Produces:
  - `interface SignInState { error?: string; ok?: boolean }`
  - `signIn(_prev: SignInState, fd: FormData): Promise<SignInState>`
  - FormData keys: `identifier`, `password`.

- [ ] **Step 1: Viết verify script cho resolution + đăng nhập (FAIL trước)**

Create `scripts/db/verify-identifier-login.mts`:

```ts
/**
 * Verifies identifier→login-email resolution + sign-in for both a username-only
 * account and an account with a real email. Uses the anon client to sign in
 * (exactly what the app does). Seeds + cleans up its own test accounts.
 * Run: npx tsx scripts/db/verify-identifier-login.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resolveAuthEmail, syntheticAuthEmail } from "../../src/lib/validation/username.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n").find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};
const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
const anon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const PW = "Verify-login-123";
const A = { username: "verify_login_noemail", email: null as string | null };
const B = { username: "verify_login_email", email: "verify.login.email@example.com" };

async function seed(acct: { username: string; email: string | null }) {
  const authEmail = resolveAuthEmail(acct);
  const created = await admin.auth.admin.createUser({ email: authEmail, password: PW, email_confirm: true });
  const authId = created.data.user!.id;
  await admin.from("app_users").insert({
    auth_id: authId, username: acct.username, email: acct.email,
    name: "Verify Login", role_id: "carer", building_id: "wesley", status: "Active",
  });
}
async function cleanup() {
  for (const u of [A.username, B.username]) await admin.from("app_users").delete().eq("username", u);
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  for (const email of [syntheticAuthEmail(A.username), B.email!]) {
    const found = list.data.users.find((x) => x.email === email);
    if (found) await admin.auth.admin.deleteUser(found.id);
  }
}

// Mirrors the signIn action's resolution: look up by username then email, then
// sign in with resolveAuthEmail(row).
async function signInBy(identifier: string, password: string) {
  const byUsername = await admin.from("app_users")
    .select("username, email").eq("username", identifier).maybeSingle();
  let row = byUsername.data;
  if (!row) {
    const byEmail = await admin.from("app_users")
      .select("username, email").eq("email", identifier).maybeSingle();
    row = byEmail.data;
  }
  if (!row) return { error: "no account" };
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const res = await client.auth.signInWithPassword({ email: resolveAuthEmail(row), password });
  return { session: res.data.session, error: res.error?.message };
}

async function main() {
  await cleanup();
  await seed(A);
  await seed(B);

  const a = await signInBy(A.username, PW);
  if (!a.session) throw new Error(`FAIL: username-only login: ${a.error}`);

  const bU = await signInBy(B.username, PW);
  if (!bU.session) throw new Error(`FAIL: login by username (has email): ${bU.error}`);

  const bE = await signInBy(B.email!, PW);
  if (!bE.session) throw new Error(`FAIL: login by email: ${bE.error}`);

  const wrong = await signInBy(A.username, "wrong-pass");
  if (wrong.session) throw new Error("FAIL: wrong password accepted");

  console.log("✓ PASS - username-only, username+email, and email logins all resolve; bad password rejected");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
```

- [ ] **Step 2: Chạy verify để xác nhận PASS cơ chế**

Run: `npx tsx scripts/db/verify-identifier-login.mts`
Expected: `✓ PASS - username-only, username+email, and email logins all resolve; bad password rejected`
(Verify này kiểm tra cơ chế DB/auth; PASS ngay khi Task 2 xong. Nếu FAIL → sửa trước khi viết action.)

- [ ] **Step 3: Viết `signIn` action**

Create `src/lib/actions/auth.ts`:

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsername, resolveAuthEmail } from "@/lib/validation/username";

export interface SignInState { error?: string; ok?: boolean }

const GENERIC = "Sai thông tin đăng nhập.";

// Resolves a username-or-email identifier to the account's Supabase login email
// (server-side, since anonymous users cannot read app_users), then signs in on
// the SSR client so the session cookie is set. Every failure returns the same
// generic message to avoid revealing whether an account exists.
export async function signIn(
  _prev: SignInState,
  fd: FormData,
): Promise<SignInState> {
  const identifier = normalizeUsername(String(fd.get("identifier") ?? ""));
  const password = String(fd.get("password") ?? "");
  if (!identifier || !password) return { error: GENERIC };

  const admin = createAdminClient();

  // Look up by username first, then by email. Two exact-match queries avoid the
  // escaping pitfalls of an .or() filter on free-text input.
  let row: { username: string; email: string | null } | null = null;
  const byUsername = await admin
    .from("app_users").select("username, email")
    .eq("username", identifier).maybeSingle();
  row = byUsername.data;
  if (!row) {
    const byEmail = await admin
      .from("app_users").select("username, email")
      .eq("email", identifier).maybeSingle();
    row = byEmail.data;
  }
  if (!row) return { error: GENERIC };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: resolveAuthEmail(row),
    password,
  });
  if (error) return { error: GENERIC };

  return { ok: true };
}
```

- [ ] **Step 4: Kiểm tra biên dịch**

Run: `npx tsc --noEmit`
Expected: không có lỗi type liên quan tới `src/lib/actions/auth.ts`.

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/lib/actions/auth.ts scripts/db/verify-identifier-login.mts
git commit -m "feat: add signIn action resolving username or email"
```

---

### Task 5: Đọc `app_users` từ DB + wire form Add user vào `createUser`

**Files:**
- Create: `src/lib/data/users.ts`
- Modify: `src/types/domain.ts` (thêm `username` vào `interface User`, ~dòng 280)
- Modify: `src/app/portal/users/page.tsx` (server component nạp danh sách)
- Modify: `src/components/portal/users/users-view.tsx` (nhận `initialUsers`, wire Add vào action)
- Modify: `src/components/portal/users/add-user-modal.tsx` (thêm field `username` + `password`)

**Interfaces:**
- Consumes: `createUser`/`CreateUserState` (Task 3).
- Produces:
  - `listAppUsers(): Promise<User[]>` trong `src/lib/data/users.ts`.
  - `AddUserForm` mở rộng: `{ name; username; email; password; role; scope }`.

**Known limitation (trong phạm vi feature):** danh sách nạp từ DB, nhưng **Edit/Delete/Permissions vẫn thao tác trên local state (chưa persist)** — nằm ngoài phạm vi feature này (spec: "về sau: update/suspend"). Chỉ luồng **Add user** ghi DB thật.

- [ ] **Step 1: Thêm `username` vào `User` type**

Trong `src/types/domain.ts`, tại `interface User` (bắt đầu ~dòng 280), thêm `username` ngay dưới `name`:

```ts
export interface User {
  name: string;
  username: string;
  email: string;
  role: UserRole;
  scope: string;
  status: UserStatus;
  last: string;
  initials: string;
  color: string;
}
```

(Giữ nguyên các field khác đang có; chỉ chèn thêm dòng `username: string;`. `email` giữ `string` — map từ DB dùng `""` khi null, xem Step 2.)

- [ ] **Step 2: Viết `listAppUsers`**

Create `src/lib/data/users.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { User, UserRole, UserStatus } from "@/types/domain";

// Avatar accents cycled by row order (the DB has no colour column).
const PALETTE = [
  "#6E875E", "#BE7350", "#8a6ba3", "#5b8f9a", "#c08a3e",
  "#9a7b4f", "#7e9b6a", "#b06a5a", "#6e879e",
];

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function relative(ts: string | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString();
}

// Loads all app_users for the Users & access screen. Runs under the caller's
// session (RLS: app_users_read allows any authenticated user).
export async function listAppUsers(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("name, username, email, role_id, scope, status, last_active_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return data.map((r, i) => ({
    name: r.name,
    username: r.username,
    email: r.email ?? "",
    role: r.role_id as UserRole,
    scope: r.scope ?? "-",
    status: r.status as UserStatus,
    last: relative(r.last_active_at),
    initials: initialsOf(r.name),
    color: PALETTE[i % PALETTE.length],
  }));
}
```

- [ ] **Step 3: Biến `page.tsx` thành server component nạp danh sách**

Replace `src/app/portal/users/page.tsx`:

```tsx
import { UsersView } from "@/components/portal/users/users-view";
import { listAppUsers } from "@/lib/data/users";

// Super-admin users & access management. Loads the live account list, then
// mounts the client island for interactivity.
export default async function UsersPage() {
  const users = await listAppUsers();
  return <UsersView initialUsers={users} />;
}
```

- [ ] **Step 4: Mở rộng `AddUserForm` + field trong modal**

Trong `src/components/portal/users/add-user-modal.tsx`:

4a. Mở rộng interface:

```ts
export interface AddUserForm {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  scope: string;
}
```

4b. Đổi câu phụ đề (không còn "email invite"): thay đoạn `<p ...>They&apos;ll get an email invite to set their password.</p>` bằng:

```tsx
<p className="mt-[5px] text-[13.5px] text-ink-muted">
  Username bắt buộc. Email tùy chọn. Bạn đặt mật khẩu cho họ.
</p>
```

4c. Thêm field Username + Password. Ngay **trên** khối `<div>` chứa `<label>Full name</label>`, chèn không có gì; thay vào đó chèn **sau** khối Full name và **trước** khối Email hai khối mới:

```tsx
<div>
  <label className={LABEL}>Username</label>
  <input
    value={form.username}
    onChange={(e) => onChange({ username: e.target.value })}
    placeholder="vd. anahera.w"
    autoCapitalize="none"
    autoCorrect="off"
    className={FIELD}
  />
</div>
```

4d. Đổi nhãn Email thành optional và giữ input:

```tsx
<div>
  <label className={LABEL}>
    Email <span className="font-normal text-ink-faint">(tùy chọn)</span>
  </label>
  <input
    value={form.email}
    onChange={(e) => onChange({ email: e.target.value })}
    placeholder="name@wesley.nz"
    className={FIELD}
  />
</div>
```

4e. Thêm khối Password ngay **sau** khối Email:

```tsx
<div>
  <label className={LABEL}>Mật khẩu</label>
  <input
    type="password"
    value={form.password}
    onChange={(e) => onChange({ password: e.target.value })}
    placeholder="Tối thiểu 8 ký tự"
    className={FIELD}
  />
</div>
```

4f. Đổi chữ nút submit (không còn "send invite"): thay `{editing ? "Save changes" : "Add user & send invite"}` bằng `{editing ? "Save changes" : "Tạo tài khoản"}`.

- [ ] **Step 5: Wire `UsersView` — nhận `initialUsers` + gọi `createUser`**

Trong `src/components/portal/users/users-view.tsx`:

5a. Thêm imports ở đầu:

```ts
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createUser } from "@/lib/actions/users";
```

5b. Đổi `EMPTY_FORM`:

```ts
const EMPTY_FORM: AddUserForm = { name: "", username: "", email: "", password: "", role: "carer", scope: "" };
```

5c. Đổi chữ ký hàm + nguồn dữ liệu ban đầu:

```tsx
export function UsersView({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
```

(Xóa dòng cũ `const [users, setUsers] = useState<User[]>(getUsers);` và bỏ `getUsers` khỏi import `@/lib/mock-data` — giữ lại `getDefaultPermissions`.)

5d. Cập nhật `openEdit` để mang theo `username`/`password` (edit vẫn local, password rỗng khi edit):

```tsx
function openEdit(user: User) {
  setForm({
    name: user.name,
    username: user.username,
    email: user.email,
    password: "",
    role: user.role,
    scope: user.scope === "-" ? "" : user.scope,
  });
  setEditingEmail(user.email);
  setAddUserOpen(true);
}
```

5e. Thay `submitUser` — nhánh **thêm mới** gọi server action; nhánh **edit** giữ local:

```tsx
function submitUser() {
  const name = form.name.trim();
  if (!name) return;

  if (editingEmail) {
    // Edit stays local for now (persisting edits is out of scope here).
    const parts = name.split(/\s+/);
    const initials = (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
    const scope = form.scope.trim() || "-";
    setUsers((prev) =>
      prev.map((u) =>
        u.email === editingEmail
          ? { ...u, name, email: form.email.trim(), role: form.role, scope, initials }
          : u,
      ),
    );
    closeModal();
    return;
  }

  setFormError(null);
  const fd = new FormData();
  fd.set("name", name);
  fd.set("username", form.username);
  fd.set("email", form.email);
  fd.set("password", form.password);
  fd.set("role", form.role);
  fd.set("scope", form.scope);

  startTransition(async () => {
    const res = await createUser({}, fd);
    if (res.error) {
      setFormError(res.error);
      return;
    }
    closeModal();
    router.refresh(); // re-fetch the live list so the new account appears
  });
}
```

5f. Đảm bảo `closeModal` xóa lỗi:

```tsx
function closeModal() {
  setAddUserOpen(false);
  setEditingEmail(null);
  setForm(EMPTY_FORM);
  setFormError(null);
}
```

5g. Truyền `error`/`submitting` xuống modal (cập nhật chỗ render `<AddUserModal ... />`):

```tsx
{addUserOpen && (
  <AddUserModal
    form={form}
    editing={editingEmail !== null}
    error={formError}
    submitting={isPending}
    onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
    onClose={closeModal}
    onSubmit={submitUser}
  />
)}
```

5h. Nhận + hiển thị `error`/`submitting` trong `AddUserModal` (thêm vào props signature của modal ở `add-user-modal.tsx`):

```tsx
export function AddUserModal({
  form, editing = false, error = null, submitting = false,
  onChange, onClose, onSubmit,
}: {
  form: AddUserForm;
  editing?: boolean;
  error?: string | null;
  submitting?: boolean;
  onChange: (patch: Partial<AddUserForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
```

Và ngay **trên** hàng nút (khối `<div className="flex justify-end gap-[10px] ...">`), chèn hiển thị lỗi:

```tsx
{error && (
  <div className="px-[26px] pb-2 text-[13px] font-medium text-high">{error}</div>
)}
```

Đồng thời thêm `disabled={submitting}` vào nút submit và đổi nhãn khi đang gửi:

```tsx
<button type="button" onClick={onSubmit} disabled={submitting}
  className="cursor-pointer rounded-[11px] bg-navy px-5 py-[11px] text-[14px] font-semibold text-cream disabled:opacity-50">
  {editing ? "Save changes" : submitting ? "Đang tạo…" : "Tạo tài khoản"}
</button>
```

- [ ] **Step 6: Kiểm tra biên dịch + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: không lỗi type/lint trong các file vừa sửa.

- [ ] **Step 7: Kiểm thử thủ công (dev server)**

Run: `pnpm dev`, đăng nhập bằng owner, mở `/portal/users`:
- Tạo user **chỉ username** (bỏ trống email) + mật khẩu ≥ 8 ký tự → thành công, user hiện trong danh sách sau refresh.
- Tạo user với **username trùng** → hiện lỗi "Username hoặc email đã tồn tại.".
- Kiểm tra Supabase (Studio) `app_users`: row mới có `username`, `email` null, `auth_id` link đúng.

- [ ] **Step 8: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/lib/data/users.ts src/types/domain.ts src/app/portal/users/page.tsx \
  src/components/portal/users/users-view.tsx src/components/portal/users/add-user-modal.tsx
git commit -m "feat: create real accounts from users screen and load list from db"
```

---

### Task 6: Login form — một field "Username hoặc email" gọi `signIn`

**Files:**
- Modify: `src/components/auth/login-view.tsx`

**Interfaces:**
- Consumes: `signIn`/`SignInState` (Task 4).

- [ ] **Step 1: Chuyển `login-view.tsx` sang identifier + server action**

Thay đổi trong `src/components/auth/login-view.tsx`:

1a. Thêm import + bỏ import client Supabase (không còn signIn phía client):

```ts
import { useTransition } from "react";
import { signIn } from "@/lib/actions/auth";
```

(Xóa `import { createClient } from "@/lib/supabase/client";`.)

1b. Đổi state `email` → `identifier`, thêm transition:

```tsx
const [identifier, setIdentifier] = useState("");
const [password, setPassword] = useState("");
const [pending, startTransition] = useTransition();
```

(Xóa `loading` state; dùng `pending`. `canSubmit` dùng `identifier`.)

```tsx
const canSubmit = identifier.trim().length > 0 && password.length > 0;
```

1c. Thay `onSubmit` gọi server action:

```tsx
function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!canSubmit || pending) return;
  setError(null);

  const fd = new FormData();
  fd.set("identifier", identifier);
  fd.set("password", password);

  startTransition(async () => {
    const res = await signIn({}, fd);
    if (res.error) {
      setError(res.error);
      return;
    }
    const next = params.get("next");
    const dest =
      next && next.startsWith("/portal")
        ? next
        : audience === "family"
          ? "/portal/family"
          : "/portal";
    router.replace(dest);
    router.refresh();
  });
}
```

1d. Thay khối input Email bằng identifier (giữ nguyên style/label wrapper), đổi label + input:

```tsx
<label className="flex flex-col gap-[6px]">
  <span className="text-[13px] font-semibold text-ink-soft">Username hoặc email</span>
  <input
    type="text"
    autoCapitalize="none"
    autoCorrect="off"
    autoComplete="username"
    value={identifier}
    onChange={(e) => setIdentifier(e.target.value)}
    placeholder="username hoặc you@wesleymteden.nz"
    className="rounded-[11px] border border-input bg-cream-2 px-[14px] py-[12px] text-[15px] text-ink outline-none focus:border-navy"
  />
</label>
```

1e. Cập nhật nút submit dùng `pending`:

```tsx
<button
  type="submit"
  disabled={!canSubmit || pending}
  className={cn(
    "mt-1 rounded-[11px] bg-navy py-[13px] text-[15px] font-semibold text-cream transition",
    canSubmit && !pending ? "hover:bg-navy/90" : "cursor-not-allowed opacity-50",
  )}
>
  {pending ? "Signing in…" : "Sign in"}
</button>
```

- [ ] **Step 2: Kiểm tra biên dịch + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: không lỗi trong `login-view.tsx`.

- [ ] **Step 3: Kiểm thử thủ công đăng nhập**

Run: `pnpm dev`. Với các tài khoản tạo ở Task 5:
- Đăng nhập bằng **username** (TK chỉ username) → vào portal.
- Với TK có email: đăng nhập bằng **username** và bằng **email** → đều vào portal.
- Sai mật khẩu / username không tồn tại → thông điệp "Sai thông tin đăng nhập." (giống nhau).
- Sau đăng nhập, middleware không đá về `/login`; refresh vẫn giữ session (cookie đã set).

- [ ] **Step 4: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/components/auth/login-view.tsx
git commit -m "feat: sign in with username or email via server action"
```

---

### Task 7: Hoàn thiện `current-user` + verify end-to-end tổng hợp

**Files:**
- Modify: `src/lib/supabase/current-user.ts` (thêm `username` vào record + select)
- Create (verify): `scripts/db/verify-username-email-login-e2e.mts`

**Interfaces:**
- Consumes: các verify scripts của Task 3 & 4 (cơ chế).
- Produces: `AppUserRecord` có thêm `username: string`.

- [ ] **Step 1: Thêm `username` vào `AppUserRecord` + query**

Trong `src/lib/supabase/current-user.ts`:

1a. Thêm field vào interface (dưới `name`):

```ts
export interface AppUserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  role_id: string;
  building_id: string | null;
  scope: string | null;
  status: string;
}
```

1b. Thêm `username` vào chuỗi select:

```ts
    const { data, error } = await supabase
      .from("app_users")
      .select("id, name, username, email, role_id, building_id, scope, status")
      .eq("auth_id", user.id)
      .maybeSingle();
```

- [ ] **Step 2: Viết verify e2e tổng hợp — chạy lại toàn bộ mắt xích**

Create `scripts/db/verify-username-email-login-e2e.mts`:

```ts
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
```

- [ ] **Step 3: Chạy verify tổng hợp**

Run: `npx tsx scripts/db/verify-username-email-login-e2e.mts`
Expected: bốn script con PASS lần lượt, kết thúc `✓ PASS - full username/email login chain verified`.

- [ ] **Step 4: Kiểm tra biên dịch cuối**

Run: `npx tsc --noEmit && pnpm lint`
Expected: sạch.

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/lib/supabase/current-user.ts scripts/db/verify-username-email-login-e2e.mts
git commit -m "feat: expose username on current user and add e2e login verification"
```

---

## Cập nhật tài liệu (sau khi tất cả task xong)

Theo quy tắc dự án (memory: cập nhật docs khi có thay đổi tính năng), cập nhật:
- `docs/03-data-model.md` — `app_users.username` (required) + `email` optional + khái niệm email tổng hợp.
- Tài liệu auth/login nếu có (mô tả login bằng username|email, invite-only, admin đặt mật khẩu).

## Known limitations (ghi nhận, ngoài phạm vi)

- Edit/Delete user và tab Roles & permissions ở `/portal/users` vẫn là **local state, chưa persist** (spec: "về sau: update/suspend").
- Không có luồng quên/đặt lại mật khẩu cho tài khoản không có email (theo quyết định: admin đặt mật khẩu, không bắt đổi).
