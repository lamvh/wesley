# Users Full CRUD Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện CRUD tài khoản thật ở `/portal/users`: **soft-delete + recover**, **update toàn bộ field** (kể cả username/email/password), **role option lấy từ bảng `roles` thật**, và **chọn toà nhà** khi tạo/sửa.

**Architecture:** Mọi ghi tài khoản đi qua server action dùng service-role client (`createAdminClient`) sau khi guard `role_id ∈ {super_admin, admin}` bằng `getCurrentUser()`. Soft-delete = cột `app_users.deleted_at`; danh sách mặc định lọc `deleted_at is null`, có toggle "Removed" để recover. Đăng nhập bị chặn nếu tài khoản đã soft-delete (kiểm tra trong `signIn`). Role options + building options nạp từ DB (`public.roles`, `public.buildings`) ở server component rồi truyền xuống client island.

**Tech Stack:** Next.js 16 (App Router, Server Actions), `@supabase/ssr` + `@supabase/supabase-js` (service-role), Postgres (Supabase), `pg` + `tsx` cho migration/verify, shadcn/ui + Tailwind.

## Global Constraints

- **Guard admin server-side** — mọi action ghi (`updateUser`/`deleteUser`/`recoverUser`) phải chặn `role_id ∉ {super_admin, admin}` TRƯỚC mọi `admin.*` (giống `createUser` hiện tại).
- **Service-role chỉ ở server** — không import `src/lib/supabase/admin.ts` vào `"use client"`.
- **Soft-delete = `deleted_at`** (đã chốt): recover = set null; list mặc định `deleted_at is null`.
- **Block login khi soft-delete** (giả định đã chốt, gắn cờ): `signIn` từ chối tài khoản `deleted_at is not null` với cùng message chung.
- **Role source of truth = `public.roles`** (id khớp `ROLE_KEYS` hiện tại: `super_admin,admin,nurse,carer,activities,family`); màu/nhãn hiển thị vẫn lấy `userRoleMeta[id]`, fallback trung tính nếu thiếu.
- **Username:** `^[a-z0-9._-]{3,30}$`, citext unique (đã có validator `@/lib/validation/username`).
- **Password khi update:** nếu để trống → không đổi; nếu nhập → tối thiểu 8 ký tự.
- **Comment/tên file không tham chiếu plan/phase.**
- **Git:** KHÔNG tự commit trừ khi được phép; bước "Commit" = stage sẵn. Conventional commits.
- **Verify chạy:** `npx tsx scripts/db/<script>.mts` (đọc `.env.local`). Header `env()`/`pgConfig()` copy từ `scripts/db/verify-user-username.mts`; header service-role (`env()` + `createClient`) copy từ `scripts/db/verify-create-user.mts`.

---

### Task 1: Migration `deleted_at` + verify schema

**Files:**
- Create: `supabase/migrations/0015_app_users_soft_delete.sql`
- Create (verify): `scripts/db/verify-app-users-soft-delete.mts`

**Interfaces:**
- Produces: cột `public.app_users.deleted_at timestamptz null` + partial index `where deleted_at is null`.

- [ ] **Step 1: Viết verify schema — FAIL trước migration**

Create `scripts/db/verify-app-users-soft-delete.mts` (copy header `env()`+`pgConfig()` từ `scripts/db/verify-user-username.mts`, phần `main()`:):

```ts
async function main() {
  const client = new pg.Client(pgConfig());
  await client.connect();
  try {
    const { rows } = await client.query(
      `select column_name, data_type, is_nullable from information_schema.columns
       where table_schema='public' and table_name='app_users' and column_name='deleted_at'`,
    );
    const col = rows[0];
    if (!col) throw new Error("FAIL: app_users.deleted_at missing");
    if (col.is_nullable !== "YES") throw new Error("FAIL: deleted_at must be nullable");
    if (!/timestamp/.test(col.data_type)) throw new Error(`FAIL: deleted_at type = ${col.data_type}`);
    console.log("✓ PASS - app_users.deleted_at present, nullable, timestamptz");
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
```

- [ ] **Step 2: Chạy verify để xác nhận FAIL**

Run: `npx tsx scripts/db/verify-app-users-soft-delete.mts`
Expected: FAIL `app_users.deleted_at missing`.

- [ ] **Step 3: Viết migration**

Create `supabase/migrations/0015_app_users_soft_delete.sql`:

```sql
-- Soft-delete for app_users: removing an account sets deleted_at instead of
-- dropping the row, so it can be recovered. Active-account queries filter on
-- deleted_at is null; the partial index keeps that filter fast. Idempotent.
alter table public.app_users
  add column if not exists deleted_at timestamptz;

create index if not exists app_users_active_idx
  on public.app_users (created_at desc)
  where deleted_at is null;
```

- [ ] **Step 4: Áp migration**

Run: `npx tsx scripts/db/apply-migration.mts supabase/migrations/0015_app_users_soft_delete.sql`
Expected: `Applied supabase/migrations/0015_app_users_soft_delete.sql`

- [ ] **Step 5: Chạy verify để xác nhận PASS**

Run: `npx tsx scripts/db/verify-app-users-soft-delete.mts`
Expected: `✓ PASS - app_users.deleted_at present, nullable, timestamptz`

- [ ] **Step 6: Commit (stage sẵn; commit nếu được phép)**

```bash
git add supabase/migrations/0015_app_users_soft_delete.sql scripts/db/verify-app-users-soft-delete.mts
git commit -m "feat: add soft-delete column to app_users"
```

---

### Task 2: Data layer — chọn `building_id`, lọc active, list removed; role & building sources

**Files:**
- Modify: `src/lib/data/users.ts` (select thêm `building_id`, `deleted_at`; lọc active; thêm `listRemovedAppUsers`)
- Modify: `src/types/domain.ts` (`interface User` — thêm `buildingId: string`)
- Create: `src/lib/data/user-roles.ts` (`listUserRoles`)
- Create: `src/lib/data/buildings.ts` (`listBuildings` từ `public.buildings`)

**Interfaces:**
- Produces:
  - `User` có thêm `buildingId: string`.
  - `listAppUsers(): Promise<User[]>` (chỉ `deleted_at is null`).
  - `listRemovedAppUsers(): Promise<User[]>`.
  - `listUserRoles(): Promise<{ id: UserRole; label: string }[]>`.
  - `listBuildings(): Promise<{ id: string; name: string }[]>`.

- [ ] **Step 1: Thêm `buildingId` vào `User`**

Trong `src/types/domain.ts`, `interface User` — thêm `buildingId: string;` (dưới `scope`):

```ts
export interface User {
  name: string;
  username: string;
  email: string;
  role: UserRole;
  scope: string;
  buildingId: string;
  status: UserStatus;
  last: string;
  initials: string;
  color: string;
}
```

- [ ] **Step 2: Sửa `data/users.ts` — active filter + building + removed list**

Thay hàm `listAppUsers` và thêm `listRemovedAppUsers` (giữ helpers `PALETTE`/`initialsOf`/`relative`):

```ts
// Loads active app_users (not soft-deleted) for the Users & access screen.
export async function listAppUsers(): Promise<User[]> {
  return queryUsers((q) => q.is("deleted_at", null));
}

// Soft-deleted accounts, for the "Removed" view where an admin can recover them.
export async function listRemovedAppUsers(): Promise<User[]> {
  return queryUsers((q) => q.not("deleted_at", "is", null));
}

async function queryUsers(
  filter: <T>(q: T) => T,
): Promise<User[]> {
  const supabase = await createClient();
  const base = supabase
    .from("app_users")
    .select("name, username, email, role_id, scope, building_id, status, last_active_at")
    .order("created_at", { ascending: false });
  const { data, error } = await filter(base);
  if (error || !data) return [];
  return data.map((r, i) => ({
    name: r.name,
    username: r.username,
    email: r.email ?? "",
    role: r.role_id as UserRole,
    scope: r.scope ?? "-",
    buildingId: r.building_id ?? "wesley",
    status: r.status as UserStatus,
    last: relative(r.last_active_at),
    initials: initialsOf(r.name),
    color: PALETTE[i % PALETTE.length],
  }));
}
```

- [ ] **Step 3: Viết `listUserRoles` (nguồn role thật)**

Create `src/lib/data/user-roles.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

// The account roles from public.roles (source of truth for the Add/Edit user
// role picker + filters). Ids match the UserRole union; label is the DB label.
export async function listUserRoles(): Promise<{ id: UserRole; label: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, label")
    .order("id");
  if (error || !data) return [];
  return data.map((r) => ({ id: r.id as UserRole, label: r.label }));
}
```

- [ ] **Step 4: Viết `listBuildings`**

Create `src/lib/data/buildings.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

// Buildings for the account building picker (Wesley / The Lodge).
export async function listBuildings(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buildings")
    .select("id, name")
    .order("name");
  if (error || !data) return [{ id: "wesley", name: "Wesley" }];
  return data.map((b) => ({ id: b.id, name: b.name }));
}
```

- [ ] **Step 5: Kiểm tra biên dịch**

Run: `npx tsc --noEmit`
Expected: FAIL ở nơi tạo `User` object thiếu `buildingId` (nếu có) và ở `page.tsx`/`users-view` (sẽ sửa Task 5). Ghi nhận, tiếp tục.

- [ ] **Step 6: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/lib/data/users.ts src/types/domain.ts src/lib/data/user-roles.ts src/lib/data/buildings.ts
git commit -m "feat: add building, role and removed-user data sources for accounts"
```

---

### Task 3: `updateUser` + `deleteUser` + `recoverUser` server actions

**Files:**
- Modify: `src/lib/actions/users.ts` (thêm 3 action + helper guard)
- Create (verify): `scripts/db/verify-user-crud.mts`

**Interfaces:**
- Consumes: `createAdminClient`, `getCurrentUser`, validators (đã có).
- Produces:
  - `updateUser(_prev: MutateUserState, fd: FormData): Promise<MutateUserState>` — keys: `originalUsername`, `name`, `username`, `email`, `password` (optional), `role`, `scope`, `building`.
  - `deleteUser(username: string): Promise<MutateUserState>` (soft).
  - `recoverUser(username: string): Promise<MutateUserState>`.
  - `interface MutateUserState { error?: string; ok?: boolean }`.

- [ ] **Step 1: Viết verify CRUD — mô phỏng update/soft-delete/recover trên DB thật**

Create `scripts/db/verify-user-crud.mts` (copy header service-role từ `scripts/db/verify-create-user.mts`):

```ts
// After the header (admin client + env), body:
const USERNAME = "verify_crud_user";
const PASSWORD = "Verify-crud-123";

async function cleanup() {
  await admin.from("app_users").delete().eq("username", USERNAME);
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const u = list.data.users.find((x) => x.email?.startsWith(`${USERNAME}@`));
  if (u) await admin.auth.admin.deleteUser(u.id);
}

async function main() {
  await cleanup();
  const created = await admin.auth.admin.createUser({
    email: `${USERNAME}@no-email.wesley.internal`, password: PASSWORD, email_confirm: true,
  });
  const authId = created.data.user!.id;
  await admin.from("app_users").insert({
    auth_id: authId, username: USERNAME, email: null, name: "Verify Crud",
    role_id: "carer", building_id: "wesley", status: "Active",
  });

  // update: role + building + name
  await admin.from("app_users").update({ role_id: "nurse", building_id: "lodge", name: "Verify Renamed" })
    .eq("username", USERNAME);
  const after = await admin.from("app_users")
    .select("role_id, building_id, name").eq("username", USERNAME).maybeSingle();
  if (after.data?.role_id !== "nurse" || after.data?.building_id !== "lodge") throw new Error("FAIL: update not persisted");

  // soft-delete + recover
  await admin.from("app_users").update({ deleted_at: new Date().toISOString() }).eq("username", USERNAME);
  const del = await admin.from("app_users").select("deleted_at").eq("username", USERNAME).maybeSingle();
  if (!del.data?.deleted_at) throw new Error("FAIL: soft-delete not set");
  await admin.from("app_users").update({ deleted_at: null }).eq("username", USERNAME);
  const rec = await admin.from("app_users").select("deleted_at").eq("username", USERNAME).maybeSingle();
  if (rec.data?.deleted_at) throw new Error("FAIL: recover did not clear deleted_at");

  console.log("✓ PASS - update, soft-delete, recover persist correctly");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
```

- [ ] **Step 2: Chạy verify để xác nhận PASS cơ chế**

Run: `npx tsx scripts/db/verify-user-crud.mts`
Expected: `✓ PASS - update, soft-delete, recover persist correctly` (kiểm tra cơ chế DB; PASS sau khi Task 1 áp migration).

- [ ] **Step 3: Thêm guard helper + 3 action vào `actions/users.ts`**

Ngay dưới `interface CreateUserState`, thêm:

```ts
export interface MutateUserState { error?: string; ok?: boolean }

// Shared admin guard: returns null when caller may manage accounts, else an
// error state. Must run before any service-role admin.* call.
async function requireAdmin(): Promise<MutateUserState | null> {
  const me = await getCurrentUser();
  const role = me?.appUser?.role_id;
  if (role !== "super_admin" && role !== "admin") return { error: "Bạn không có quyền quản lý tài khoản." };
  return null;
}
```

(Tuỳ chọn: refactor `createUser` để dùng `requireAdmin()` — giữ hành vi cũ.)

Cuối file, thêm:

```ts
// Updates every editable field of an account. Password/username/email are pushed
// to Supabase Auth (auth.users) as well as app_users so login stays consistent;
// a blank password means "leave unchanged". Admin-only.
export async function updateUser(
  _prev: MutateUserState,
  fd: FormData,
): Promise<MutateUserState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const original = str(fd, "originalUsername");
  const name = str(fd, "name");
  const rawUsername = str(fd, "username");
  const rawEmail = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role");
  const scope = str(fd, "scope");
  const building = str(fd, "building") || "wesley";

  if (!original) return { error: "Thiếu tài khoản cần sửa." };
  if (!name) return { error: "Vui lòng nhập họ tên." };
  const usernameError = validateUsername(rawUsername);
  if (usernameError) return { error: usernameError };
  if (rawEmail && !isValidEmail(rawEmail)) return { error: "Email không hợp lệ." };
  if (password && password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự." };
  if (!role) return { error: "Vui lòng chọn vai trò." };

  const username = normalizeUsername(rawUsername);
  const email = rawEmail ? rawEmail.toLowerCase() : null;
  const admin = createAdminClient();

  // Find the auth_id for the account being edited.
  const { data: row } = await admin
    .from("app_users").select("auth_id").eq("username", original).maybeSingle();
  if (!row) return { error: "Không tìm thấy tài khoản." };
  const authId = row.auth_id as string;

  // Sync auth.users: login email always tracks real email or synthetic address;
  // password only when a new one was typed.
  const authEmail = email ?? syntheticAuthEmail(username);
  const authPatch: { email: string; password?: string } = { email: authEmail };
  if (password) authPatch.password = password;
  const upd = await admin.auth.admin.updateUserById(authId, authPatch);
  if (upd.error) return { error: "Không cập nhật được đăng nhập (email có thể trùng)." };

  const { error: rowErr } = await admin.from("app_users").update({
    username, email, name, role_id: role, scope: scope || null, building_id: building,
  }).eq("username", original);
  if (rowErr) {
    if (rowErr.code === "23505") return { error: "Username hoặc email đã tồn tại." };
    return { error: "Không lưu được thay đổi, thử lại." };
  }

  revalidatePath("/portal/users");
  return { ok: true };
}

// Soft-delete: mark the row removed (recoverable) rather than dropping it. The
// auth account stays but signIn refuses removed accounts.
export async function deleteUser(username: string): Promise<MutateUserState> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!username) return { error: "Thiếu tài khoản." };
  const admin = createAdminClient();
  const { error } = await admin.from("app_users")
    .update({ deleted_at: new Date().toISOString() }).eq("username", username);
  if (error) return { error: "Không xoá được tài khoản, thử lại." };
  revalidatePath("/portal/users");
  return { ok: true };
}

// Restore a soft-deleted account.
export async function recoverUser(username: string): Promise<MutateUserState> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!username) return { error: "Thiếu tài khoản." };
  const admin = createAdminClient();
  const { error } = await admin.from("app_users")
    .update({ deleted_at: null }).eq("username", username);
  if (error) return { error: "Không khôi phục được, thử lại." };
  revalidatePath("/portal/users");
  return { ok: true };
}
```

- [ ] **Step 4: Kiểm tra biên dịch**

Run: `npx tsc --noEmit`
Expected: `actions/users.ts` sạch (UI wiring sửa ở Task 5).

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/lib/actions/users.ts scripts/db/verify-user-crud.mts
git commit -m "feat: add updateUser, soft deleteUser and recoverUser actions"
```

---

### Task 4: Chặn đăng nhập tài khoản đã soft-delete

**Files:**
- Modify: `src/lib/actions/auth.ts` (thêm `deleted_at` vào select + từ chối nếu đã xoá)
- Create (verify): `scripts/db/verify-deleted-user-login-blocked.mts`

**Interfaces:**
- Consumes: schema `deleted_at` (Task 1).

- [ ] **Step 1: Viết verify — tài khoản soft-deleted không đăng nhập được**

Create `scripts/db/verify-deleted-user-login-blocked.mts` (copy header service-role + anon từ `scripts/db/verify-identifier-login.mts`); logic: seed 1 user, set `deleted_at`, thử resolve→signIn theo đúng luật của action (bỏ qua nếu `deleted_at` khác null) → kỳ vọng bị chặn:

```ts
// ...header (admin + anon clients, env)...
const USERNAME = "verify_deleted_login";
const PASSWORD = "Verify-del-123";

async function cleanup() {
  await admin.from("app_users").delete().eq("username", USERNAME);
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const u = list.data.users.find((x) => x.email?.startsWith(`${USERNAME}@`));
  if (u) await admin.auth.admin.deleteUser(u.id);
}
async function main() {
  await cleanup();
  const created = await admin.auth.admin.createUser({
    email: `${USERNAME}@no-email.wesley.internal`, password: PASSWORD, email_confirm: true,
  });
  await admin.from("app_users").insert({
    auth_id: created.data.user!.id, username: USERNAME, email: null, name: "Del",
    role_id: "carer", building_id: "wesley", status: "Active",
    deleted_at: new Date().toISOString(),
  });
  // Mirror the signIn guard: look up row incl deleted_at; refuse if removed.
  const { data } = await admin.from("app_users")
    .select("username, email, deleted_at").eq("username", USERNAME).maybeSingle();
  if (!data) throw new Error("FAIL: seed missing");
  const blocked = data.deleted_at != null;
  if (!blocked) throw new Error("FAIL: removed account not blocked by guard");
  console.log("✓ PASS - soft-deleted account is refused at login");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
```

- [ ] **Step 2: Chạy verify để xác nhận PASS cơ chế**

Run: `npx tsx scripts/db/verify-deleted-user-login-blocked.mts`
Expected: `✓ PASS - soft-deleted account is refused at login`.

- [ ] **Step 3: Thêm guard vào `signIn`**

Trong `src/lib/actions/auth.ts`, thêm `deleted_at` vào cả 2 select và từ chối trước khi `signInWithPassword`:

```ts
  let row: { username: string; email: string | null; deleted_at: string | null } | null = null;
  const byUsername = await admin
    .from("app_users").select("username, email, deleted_at")
    .eq("username", identifier).maybeSingle();
  row = byUsername.data;
  if (!row) {
    const byEmail = await admin
      .from("app_users").select("username, email, deleted_at")
      .eq("email", identifier).maybeSingle();
    row = byEmail.data;
  }
  if (!row || row.deleted_at != null) return { error: GENERIC };
```

(Tài khoản đã xoá trả cùng `GENERIC` — không lộ trạng thái.)

- [ ] **Step 4: Kiểm tra biên dịch**

Run: `npx tsc --noEmit`
Expected: `auth.ts` sạch.

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/lib/actions/auth.ts scripts/db/verify-deleted-user-login-blocked.mts
git commit -m "feat: block sign-in for soft-deleted accounts"
```

---

### Task 5: UI — role/building từ real data, update thật, soft-delete + recover

**Files:**
- Modify: `src/app/portal/users/page.tsx` (nạp roles + buildings + removed)
- Modify: `src/components/portal/users/users-view.tsx` (wiring update/delete/recover, toggle Removed)
- Modify: `src/components/portal/users/add-user-modal.tsx` (role từ prop, thêm building select)
- Modify: `src/components/portal/users/role-filter-pills.tsx` (nhận roles từ prop)

**Interfaces:**
- Consumes: `updateUser`/`deleteUser`/`recoverUser`/`MutateUserState` (Task 3), `listUserRoles`/`listBuildings`/`listRemovedAppUsers` (Task 2).
- Produces: `AddUserForm` thêm `building: string`; modal nhận `roles`/`buildings`.

- [ ] **Step 1: `page.tsx` nạp roles + buildings + removed**

Replace `src/app/portal/users/page.tsx`:

```tsx
import { UsersView } from "@/components/portal/users/users-view";
import { listAppUsers, listRemovedAppUsers } from "@/lib/data/users";
import { listUserRoles } from "@/lib/data/user-roles";
import { listBuildings } from "@/lib/data/buildings";

export default async function UsersPage() {
  const [users, removed, roles, buildings] = await Promise.all([
    listAppUsers(),
    listRemovedAppUsers(),
    listUserRoles(),
    listBuildings(),
  ]);
  return (
    <UsersView
      initialUsers={users}
      removedUsers={removed}
      roles={roles}
      buildings={buildings}
    />
  );
}
```

- [ ] **Step 2: `AddUserForm` thêm `building`; modal role từ prop + building select**

2a. Trong `add-user-modal.tsx`, mở rộng form + props, bỏ import mock:

```ts
export interface AddUserForm {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  scope: string;
  building: string;
}
```

(Xoá `import { ROLE_KEYS } from "@/lib/mock-data";` — vẫn giữ `userRoleMeta` cho màu.)

2b. Thêm `roles`/`buildings` vào props signature:

```tsx
export function AddUserModal({
  form, editing = false, error = null, submitting = false,
  roles, buildings, onChange, onClose, onSubmit,
}: {
  form: AddUserForm;
  editing?: boolean;
  error?: string | null;
  submitting?: boolean;
  roles: { id: UserRole; label: string }[];
  buildings: { id: string; name: string }[];
  onChange: (patch: Partial<AddUserForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
```

2c. Đổi khối Role map `roles` (thay `ROLE_KEYS`), dùng `userRoleMeta[r.id]` cho màu với fallback:

```tsx
          <div>
            <label className={LABEL}>Role</label>
            <div className="grid grid-cols-2 gap-[9px]">
              {roles.map((r) => {
                const meta = userRoleMeta[r.id];
                const on = form.role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onChange({ role: r.id })}
                    className={cn(
                      "rounded-[11px] border-[1.5px] px-3 py-[10px] text-left text-[13px] font-semibold transition-colors",
                      on
                        ? cn(meta?.badge.split(" ")[0], meta?.dot.replace("bg-", "border-"), meta?.text)
                        : "border-line-soft bg-cream-2 text-ink-soft",
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
```

2d. Thêm khối **Building** ngay dưới Role:

```tsx
          <div>
            <label className={LABEL}>Toà nhà</label>
            <select
              value={form.building}
              onChange={(e) => onChange({ building: e.target.value })}
              className={FIELD}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
```

- [ ] **Step 3: `role-filter-pills.tsx` nhận roles từ prop**

Đổi để nhận `roles: { id: UserRole; label: string }[]` thay vì import `ROLE_KEYS`; map `roles` cho các pill (giữ `userRoleMeta[id].label` hoặc dùng `r.label`, và count `users.filter((u) => u.role === r.id).length`). Bỏ `import { ROLE_KEYS } from "@/lib/mock-data";`.

- [ ] **Step 4: `users-view.tsx` — wiring thật**

4a. Cập nhật imports + props:

```tsx
import { createUser, updateUser, deleteUser, recoverUser } from "@/lib/actions/users";
```

```tsx
export function UsersView({
  initialUsers, removedUsers, roles, buildings,
}: {
  initialUsers: User[];
  removedUsers: User[];
  roles: { id: UserRole; label: string }[];
  buildings: { id: string; name: string }[];
}) {
```

4b. `EMPTY_FORM` thêm `building` (mặc định building đầu tiên):

```tsx
const EMPTY_FORM: AddUserForm = { name: "", username: "", email: "", password: "", role: "carer", scope: "", building: "wesley" };
```

4c. `openEdit` mang thêm `building`:

```tsx
  function openEdit(user: User) {
    setForm({
      name: user.name, username: user.username, email: user.email, password: "",
      role: user.role, scope: user.scope === "-" ? "" : user.scope, building: user.buildingId,
    });
    setEditingUsername(user.username);
    setAddUserOpen(true);
  }
```

4d. Thay nhánh edit trong `submitUser` bằng gọi `updateUser` (bỏ mutate local):

```tsx
    if (editingUsername) {
      setFormError(null);
      const fd = new FormData();
      fd.set("originalUsername", editingUsername);
      fd.set("name", name);
      fd.set("username", form.username);
      fd.set("email", form.email);
      fd.set("password", form.password);
      fd.set("role", form.role);
      fd.set("scope", form.scope);
      fd.set("building", form.building);
      startTransition(async () => {
        const res = await updateUser({}, fd);
        if (res.error) { setFormError(res.error); return; }
        closeModal();
        router.refresh();
      });
      return;
    }
```

(Nhánh tạo mới: thêm `fd.set("building", form.building);` vào FormData hiện có.)

4e. Thay `doDelete` bằng gọi action:

```tsx
  function doDelete() {
    if (!confirmUser) return;
    const username = confirmUser.username;
    startTransition(async () => {
      await deleteUser(username);
      setConfirmUser(null);
      router.refresh();
    });
  }
```

4f. Thêm state + nút toggle "Removed" và recover. Thêm state:

```tsx
  const [showRemoved, setShowRemoved] = useState(false);
  function recover(username: string) {
    startTransition(async () => {
      await recoverUser(username);
      router.refresh();
    });
  }
```

Trong vùng tab "users", khi `showRemoved` bật thì render danh sách `removedUsers` với nút **Recover** (dùng lại `UserTable` với 1 prop tùy chọn `onRecover`, hoặc render list gọn). Thêm nút toggle cạnh tiêu đề:

```tsx
        <button type="button" onClick={() => setShowRemoved((v) => !v)}
          className="text-[13px] font-semibold text-ink-muted underline">
          {showRemoved ? "Xem đang hoạt động" : `Đã xoá (${removedUsers.length})`}
        </button>
```

(Chi tiết render removed list: map `removedUsers`, mỗi dòng tên + nút `onClick={() => recover(u.username)}` "Khôi phục".)

4g. Truyền `roles`/`buildings` vào `<AddUserModal>`:

```tsx
        <AddUserModal
          form={form}
          editing={editingUsername !== null}
          error={formError}
          submitting={isPending}
          roles={roles}
          buildings={buildings}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onClose={closeModal}
          onSubmit={submitUser}
        />
```

Và `<RoleFilterPills users={users} roles={roles} active={roleFilter} onSelect={setRoleFilter} />`.

- [ ] **Step 5: Kiểm tra biên dịch + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: sạch trong các file vừa sửa.

- [ ] **Step 6: Kiểm thử thủ công (dev server)**

Run: `pnpm dev`, đăng nhập admin, `/portal/users`:
- Sửa 1 user: đổi tên/role/toà nhà + đặt mật khẩu mới → lưu → refresh vẫn còn (đăng nhập lại bằng mật khẩu mới OK).
- Đổi username khi sửa → đăng nhập bằng username mới OK.
- Xoá 1 user → biến khỏi danh sách; bật "Đã xoá" → thấy → Khôi phục → quay lại danh sách.
- Đăng nhập bằng tài khoản đã xoá (trước khi khôi phục) → "Sai thông tin đăng nhập.".
- Role pill + option đúng theo bảng `roles` thật.

- [ ] **Step 7: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/app/portal/users/page.tsx src/components/portal/users/users-view.tsx \
  src/components/portal/users/add-user-modal.tsx src/components/portal/users/role-filter-pills.tsx
git commit -m "feat: real update, soft-delete and recover for accounts with role and building from db"
```

---

### Task 6: Verify e2e tổng hợp + cập nhật docs

**Files:**
- Create (verify): `scripts/db/verify-user-crud-e2e.mts`
- Modify: `docs/03-data-model.md`, `docs/screen-registry.md`, `docs/features/portal` (mục Users)

**Interfaces:**
- Consumes: các verify script Task 1/3/4.

- [ ] **Step 1: Viết verify tổng hợp**

Create `scripts/db/verify-user-crud-e2e.mts` (spawn tuần tự như `verify-username-email-login-e2e.mts`):

```ts
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
```

- [ ] **Step 2: Chạy verify tổng hợp**

Run: `npx tsx scripts/db/verify-user-crud-e2e.mts`
Expected: 3 script con PASS → `✓ PASS - user CRUD ... verified`.

- [ ] **Step 3: Cập nhật docs**

- `docs/03-data-model.md`: `app_users.deleted_at` (soft-delete + recover), role_id → `roles`, building_id → `buildings`.
- `docs/screen-registry.md` + `docs/features/portal`: Users & access giờ có Update thật, soft-delete + recover, role/building từ real data.

- [ ] **Step 4: Kiểm tra cuối**

Run: `npx tsc --noEmit && pnpm lint`
Expected: sạch.

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add scripts/db/verify-user-crud-e2e.mts docs/03-data-model.md docs/screen-registry.md docs/features/portal
git commit -m "feat: add user CRUD e2e verification and update docs"
```

---

## Self-review

- **Coverage:** F1 migration = Task 1; F2 delete/recover = Task 3 + wiring Task 5; F3 update = Task 3 + Task 5; F4 role real-data = Task 2 (`listUserRoles`) + Task 5 (modal/filter); F5 building = Task 2 (`listBuildings`) + Task 5 (select) + actions Task 3; F6 e2e+docs = Task 6; login-block = Task 4. ✓
- **Guard:** `requireAdmin()` chạy đầu mọi action ghi. ✓
- **Type consistency:** `User.buildingId`, `AddUserForm.building`, `MutateUserState`, `updateUser` FormData keys (`originalUsername`,`building`) khớp giữa Task 3 và Task 5. ✓
- **Giữ đúng phạm vi:** roles cho USER = `public.roles` (khác `staff_roles` của roster). ✓

## Giả định cần xác nhận khi chạy

- **Block login khi soft-delete**: mặc định CHẶN (Task 4). Nếu muốn cho phép đăng nhập tài khoản removed → bỏ điều kiện `row.deleted_at != null` ở Task 4 Step 3.
- **Đổi username/email khi update** đẩy sang `auth.users` qua `updateUserById` — nếu chỉ muốn sửa hồ sơ (không đụng đăng nhập), tách password/username/email ra luồng riêng.
