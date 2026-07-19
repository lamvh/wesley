# Username + Email Login (email optional) — Design

**Date:** 2026-07-20
**Status:** Approved (design) — ready for implementation planning

## Summary

Admin tạo tài khoản với **username bắt buộc** và **email tùy chọn**. Người dùng đăng
nhập bằng **username hoặc email** (identifier duy nhất) + mật khẩu. Hệ thống giữ
**invite-only** — không có trang đăng ký công khai.

## Decisions (đã chốt)

| Vấn đề | Quyết định |
|---|---|
| Mô hình tạo TK | Admin tạo, giữ invite-only (không self-register) |
| Cấp mật khẩu | Admin đặt mật khẩu, **không** bắt đổi ở lần đầu |
| Cầu nối username ↔ Supabase | **Phương án A** — server action phân giải identifier + đăng nhập server-side |

## Bối cảnh hệ thống

- Next.js 16 + Supabase Auth (email + password), shadcn/ui.
- `app_users`: liên kết `auth.users(id)`; hiện `email citext unique not null`.
- Login hiện tại: email + password (`login-view.tsx`), có toggle Staff/Family (chỉ đổi redirect + copy).
- `/portal/users` hiện **hoàn toàn mock** (React state, `getUsers()`); AddUserModal chưa ghi DB/auth.
- `SUPABASE_SERVICE_ROLE_KEY` có sẵn trong env; **chưa** có service-role client.

## Vấn đề cốt lõi

Supabase Auth chỉ đăng nhập bằng email/phone. Khi email optional, TK chỉ có username
vẫn cần một email trong `auth.users`. User chưa đăng nhập là anonymous → RLS không cho
đọc `app_users` để tự tra username→email. ⇒ Phân giải username phải làm **phía server**.

## Kiến trúc

### Ba khái niệm email/identifier tách bạch

- `app_users.username` — handle đăng nhập (bắt buộc, unique, citext).
- `app_users.email` — email liên lạc thật (tùy chọn, nullable, cũng là identifier hợp lệ).
- `auth.users.email` — email đăng nhập Supabase = email thật nếu có, ngược lại email
  tổng hợp `<username>@no-email.wesley.internal` (domain riêng, không routable).

## Phần 1 — Data model

Migration mới `supabase/migrations/0014_user_username.sql`:

```sql
alter table public.app_users
  add column if not exists username citext unique;

alter table public.app_users
  alter column email drop not null;

update public.app_users
  set username = split_part(email::text, '@', 1)
  where username is null and email is not null;

alter table public.app_users
  alter column username set not null;
```

- `username` — citext unique not null.
- `email` — citext unique **nullable** (Postgres cho phép nhiều NULL với unique).

## Phần 2 — Luồng admin tạo tài khoản

- **Service-role client mới** `src/lib/supabase/admin.ts` (server-only, dùng `SUPABASE_SERVICE_ROLE_KEY`).
- **Server action** `src/lib/actions/users.ts` → `createUser`:
  1. Validate: `username` (bắt buộc, đúng format, chưa tồn tại), `email` (tùy chọn, hợp
     lệ nếu có), `password` (>= 8 ký tự), `name`, `role`, ...
  2. `authEmail = email ?? "<username>@no-email.wesley.internal"`.
  3. `admin.auth.admin.createUser({ email: authEmail, password, email_confirm: true })`
     — không gửi mail xác nhận.
  4. Insert `app_users { auth_id, username, email: email ?? null, name, role_id, ...,
     status: 'Active' }`.
  5. Insert lỗi → **rollback**: xóa auth user vừa tạo (tránh mồ côi).
- Wire `AddUserModal`: thêm field `username` + `password`; `UsersView` chuyển từ mock
  sang đọc `app_users` thật từ DB.

## Phần 3 — Luồng đăng nhập (Phương án A)

- `login-view.tsx`: gộp Email → **1 field "Username hoặc email"**.
- **Server action** `signIn({ identifier, password })` trong `src/lib/actions/auth.ts`:
  1. `identifier = identifier.trim()`.
  2. Service-role tra `app_users` theo `username = identifier OR email = identifier` → `auth_id`.
  3. Không thấy → lỗi chung *"Sai thông tin đăng nhập"* (không tiết lộ tồn tại).
  4. `admin.getUserById(auth_id)` → lấy `auth.users.email`.
  5. `signInWithPassword({ email, password })` trên **SSR server client** → set cookie session.
  6. Trả `{ ok }` → client `router.replace(dest)` + `refresh()`.

## Phần 4 — Quy tắc username & validation

- Format: `^[a-z0-9._-]{3,30}$`, chuẩn hóa lowercase trước khi lưu.
- Không chứa `@` (rõ ràng UX; lookup vẫn match cả 2 cột).
- Unique case-insensitive (DB constraint + tiền kiểm ở action).
- Reserved (chặn): `admin`, `root`, `system`, `support`.
- Email (nếu nhập): regex hợp lệ + unique; **không** xác thực email.
- Password: tối thiểu 8 ký tự.

## Phần 5 — Files

**Tạo mới**
- `supabase/migrations/0014_user_username.sql`
- `src/lib/supabase/admin.ts` — service-role client (server-only)
- `src/lib/actions/auth.ts` — `signIn`
- `src/lib/actions/users.ts` — `createUser` (về sau: update/suspend)
- `src/lib/data/users.ts` — đọc `app_users` từ DB
- `src/lib/validation/username.ts` — regex + reserved + `resolveAuthEmail`

**Sửa**
- `src/components/auth/login-view.tsx` — 1 field identifier, gọi `signIn`
- `src/components/portal/users/users-view.tsx` — nguồn DB thay mock
- `src/components/portal/users/add-user-modal.tsx` — thêm `username` + `password`
- `src/types/domain.ts` — thêm `username` vào type `User`
- `src/lib/supabase/current-user.ts` — trả thêm `username`

## Phần 6 — Edge cases & bảo mật

- Lỗi login **đồng nhất** (username không tồn tại hoặc sai mật khẩu → cùng thông điệp) → chống liệt kê tài khoản.
- Service-role **chỉ ở server**; không `NEXT_PUBLIC_` cho key; không import `admin.ts` vào client component.
- Trùng username/email → bắt lỗi unique DB (SQLSTATE 23505) → "Username đã tồn tại".
- Rollback auth user nếu insert `app_users` fail.
- Email tổng hợp `<username>@no-email.wesley.internal`: lookup login **không** match cột này (chỉ match `email` thật + `username`) → không thể đăng nhập bằng email giả.
- Toggle Staff/Family giữ nguyên (chỉ redirect + copy).

## Phần 7 — Testing

- Migration chạy sạch (idempotent, backfill đúng).
- TK **chỉ username** → login bằng username OK; không login được bằng email.
- TK **có email** → login được bằng **cả** username lẫn email.
- Trùng username/email → lỗi rõ ràng, không tạo auth user mồ côi.
- Sai mật khẩu / username không tồn tại → cùng thông điệp.
- User mới hiện trong `/portal/users` (đọc DB thật).
- Verify end-to-end bằng script (tương tự `scripts/` sẵn có).

## Open questions

Không còn — các quyết định nền tảng đã chốt.
