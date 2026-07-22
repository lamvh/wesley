# Staff Preferred Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho mỗi `staff` một `preferred_name` optional, hiển thị thay tên chính ở Roster grid, Duty export sheet và `/today` (kể cả on-call), giữ tên thật ở Staff management + sidebar + bảng Users.

**Architecture:** Cột DB mới `staff.preferred_name` + recreate 2 RPC (`today_on_duty`, `today_on_call`) coalesce preferred cho `/today`. Phía TS: thêm field `preferredName` vào `StaffRecord`, 1 helper client-safe `staffDisplayName()` áp tại các điểm render roster/duty. Form staff thêm 1 input để nhập.

**Tech Stack:** Next.js (App Router, server actions), Supabase Postgres (SQL migrations), TypeScript, ESLint.

## Global Constraints

- No code before its doc — cập nhật docs cùng đợt (xem Task 6). Nguồn: `docs/00-rules-and-conventions.md`.
- Không tham chiếu số phase/finding trong code/comment/tên file migration — chỉ domain slug.
- Gate của repo (không có unit-test harness cho thay đổi này): `npx tsc --noEmit` sạch + `npx eslint` sạch trên file đụng tới. Verify DB do người dùng chạy manual.
- **KHÔNG commit** (theo git rule của user) — để lại working-tree edits. Bỏ mọi bước commit.
- Format hiển thị: `preferredName || name` (thay hẳn, không hiện kèm). Initials/màu giữ theo `name` thật.
- Building cố định `"wesley"` như phần còn lại của app.

---

### Task 1: Migration `0023` — cột `preferred_name` + recreate 2 RPC

**Files:**
- Create: `supabase/migrations/0023_staff_preferred_name.sql`
- Modify: `supabase/migrations/0022_today_on_duty_shift_role.sql:1` (thêm 1 dòng comment "superseded by 0023")

**Interfaces:**
- Produces: cột `public.staff.preferred_name text` (nullable); RPC `today_on_duty()` và `today_on_call()` trả `staff_name` đã coalesce preferred.

- [ ] **Step 1: Viết migration 0023**

Tạo `supabase/migrations/0023_staff_preferred_name.sql`:

```sql
-- Optional "preferred name" per staffer (the name they like to be called, e.g.
-- "Bob" for "Robert Smith"). The roster grid, duty-export sheet and public
-- /today board show this in place of the legal name when set; the staff record,
-- sidebar identity and Users table keep the legal name. Avatar initials stay
-- derived from the legal name.
alter table public.staff add column if not exists preferred_name text;

-- Recreate today_on_duty as the final version: shift-role grouping + shift-
-- template building split (both prior) PLUS preferred-name display. staff_name
-- falls back to the legal name when preferred_name is empty/null.
create or replace function public.today_on_duty()
returns table (building_id text, role text, staff_name text, shift_time text)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(st.building_id, rs.building_id) as building_id,
         coalesce(nullif(st.role, ''), s.role) as role,
         coalesce(nullif(s.preferred_name, ''), s.name) as staff_name,
         coalesce(st.time_label, st.name) as shift_time
  from public.roster_shifts rs
  join public.staff s on s.id = rs.staff_id
  left join public.shift_templates st on st.id = rs.shift_id
  where rs.shift_date = (now() at time zone 'Pacific/Auckland')::date
  order by coalesce(st.building_id, rs.building_id),
           coalesce(nullif(st.role, ''), s.role),
           coalesce(st.time_label, st.name);
$$;

grant execute on function public.today_on_duty() to anon, authenticated;

-- On-call strip on /today: same preferred-name fallback for consistency with
-- the on-duty rows on the same board.
create or replace function public.today_on_call()
returns table (building_id text, staff_name text)
language sql
stable
security definer
set search_path = public
as $$
  select oc.building_id,
         coalesce(nullif(s.preferred_name, ''), s.name) as staff_name
  from public.roster_on_call oc
  join public.staff s on s.id = oc.staff_id
  where oc.on_call_date = (now() at time zone 'Pacific/Auckland')::date;
$$;

grant execute on function public.today_on_call() to anon, authenticated;
```

- [ ] **Step 2: Đánh dấu 0022 superseded**

Thêm dòng comment ngay đầu `supabase/migrations/0022_today_on_duty_shift_role.sql` (trước dòng 1 hiện tại):

```sql
-- SUPERSEDED BY 0023_staff_preferred_name.sql (recreates today_on_duty with the
-- same role+building logic plus preferred-name display). Apply 0023 instead;
-- kept here for history. Applying 0022 first is harmless (0023 overrides it).
```

- [ ] **Step 3: Kiểm tra cú pháp SQL bằng mắt**

Đọc lại 0023: đúng thứ tự `alter` → `today_on_duty` → grant → `today_on_call` → grant; mỗi hàm coalesce `preferred_name`. Không có gate tự động cho SQL (verify DB do user chạy manual — xem Task 7).

---

### Task 2: `StaffRecord.preferredName` + `getStaff()` + helper hiển thị

**Files:**
- Modify: `src/types/domain.ts` (interface `StaffRecord`, ~line 474)
- Modify: `src/lib/data/staff.ts:8` (select) và `:11-20` (map)
- Create: `src/lib/staff-display.ts`

**Interfaces:**
- Consumes: cột `staff.preferred_name` (Task 1).
- Produces: `StaffRecord.preferredName: string`; `staffDisplayName(s: { name: string; preferredName: string }): string`.

- [ ] **Step 1: Thêm field vào `StaffRecord`**

Trong `src/types/domain.ts`, interface `StaffRecord`, thêm sau dòng `status: string; initials: string; color: string;`:

```typescript
  /** preferred display name (the name they like to be called); "" if unset.
   *  Shown in place of `name` on the roster grid, duty export and /today. */
  preferredName: string;
```

- [ ] **Step 2: `getStaff()` select + map `preferred_name`**

`src/lib/data/staff.ts` — đổi select (line 8) thêm `preferred_name`:

```typescript
    .select("id,name,preferred_name,role,roles,contract,hours,phone,start_label,status,initials,color,annual,taken,visa_type,visa_expiry,roster_group_id")
```

Và trong map (sau `id: r.id, name: r.name,`), thêm:

```typescript
    preferredName: r.preferred_name ?? "",
```

- [ ] **Step 3: Tạo helper `staffDisplayName`**

Tạo `src/lib/staff-display.ts`:

```typescript
// Display name for roster/duty/today surfaces: the staffer's preferred name when
// set, otherwise their legal name. Client-safe (types only, no server imports)
// so client components (roster-grid) can use it too.
export function staffDisplayName(s: { name: string; preferredName: string }): string {
  return s.preferredName || s.name;
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: sạch (không lỗi mới). `getStaff()` giờ trả object có `preferredName` — hợp `StaffRecord`.

---

### Task 3: Áp `staffDisplayName` ở roster grid + on-call

**Files:**
- Modify: `src/components/portal/roster/roster-grid.tsx:168` và `:182`
- Modify: `src/components/portal/roster/roster-view.tsx:107`

**Interfaces:**
- Consumes: `staffDisplayName` (Task 2); `st`/`s` là `StaffRecord` (có `preferredName`).

- [ ] **Step 1: Import helper vào roster-grid**

`src/components/portal/roster/roster-grid.tsx` — thêm import (cạnh các import `@/lib/...`):

```typescript
import { staffDisplayName } from "@/lib/staff-display";
```

- [ ] **Step 2: Đổi chip tên + staffName prop**

Line ~168, đổi `{st.name}` → `{staffDisplayName(st)}`:

```tsx
                        <span className="text-[13.5px] font-semibold leading-[1.15] text-ink">
                          {staffDisplayName(st)}
                        </span>
```

Line ~182, đổi `staffName={st.name}` → `staffName={staffDisplayName(st)}`:

```tsx
                          staffName={staffDisplayName(st)}
```

- [ ] **Step 3: On-call option label dùng preferred**

`src/components/portal/roster/roster-view.tsx` — thêm import:

```typescript
import { staffDisplayName } from "@/lib/staff-display";
```

Trong `onCallOptions` (line ~104-111), đổi `label: s.name` → `label: staffDisplayName(s)`:

```typescript
  const onCallOptions = bands.flatMap((b) =>
    b.staff.map((s) => ({
      value: s.id,
      label: staffDisplayName(s),
      initials: s.initials,
      color: s.color,
    })),
  );
```

- [ ] **Step 4: Type-check + lint**

Run: `npx tsc --noEmit && npx eslint src/components/portal/roster/roster-grid.tsx src/components/portal/roster/roster-view.tsx`
Expected: sạch.

---

### Task 4: Áp `staffDisplayName` ở duty export sheet

**Files:**
- Modify: `src/lib/duty-roster.ts:98` (+ import)

**Interfaces:**
- Consumes: `staffDisplayName` (Task 2); `st` trong vòng lặp là `StaffRecord` (từ `bands.flatMap(b => b.staff)`).

- [ ] **Step 1: Import helper**

`src/lib/duty-roster.ts` — thêm import (cạnh import `RosterBand`):

```typescript
import { staffDisplayName } from "@/lib/staff-display";
```

- [ ] **Step 2: Đổi dòng in dùng preferred**

Line ~98, đổi `const row = { time: tm, name: st.name };` → dùng helper:

```typescript
          const row = { time: tm, name: staffDisplayName(st) };
```

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc --noEmit && npx eslint src/lib/duty-roster.ts`
Expected: sạch. On-call strip trên sheet không cần đổi ở đây — đã lấy preferred qua `onCallNameByDay` (Task 3 Step 3).

---

### Task 5: Form staff — input Preferred name + lưu

**Files:**
- Modify: `src/components/portal/staff/staff-form.tsx` (thêm `<Field>` sau Full name, ~line 154)
- Modify: `src/lib/actions/staff.ts:28-37` (object `fields`)

**Interfaces:**
- Consumes: `StaffRecord.preferredName` (Task 2) cho `defaultValue`.
- Produces: field `preferred_name` được persist qua `saveStaff` (insert + update).

- [ ] **Step 1: Thêm input Preferred name vào form**

`src/components/portal/staff/staff-form.tsx` — ngay sau khối `<Field label="Full name" ... />` (kết thúc ~line 154), thêm:

```tsx
          <Field
            label="Preferred name"
            name="preferredName"
            defaultValue={staff?.preferredName}
            placeholder="e.g. Ana"
          />
```

(`Field` không truyền `required` → optional; khớp signature `Field` hiện có: `label`, `name`, `defaultValue`, `placeholder`.)

- [ ] **Step 2: `saveStaff` lưu `preferred_name`**

`src/lib/actions/staff.ts` — trong object `fields` (sau `name, roles, role: roles[0],`), thêm:

```typescript
    preferred_name: str(fd, "preferredName") || null,
```

`fields` dùng chung cho cả `update` (line ~42) và `insert` (line ~46) nên áp cả 2 đường.

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc --noEmit && npx eslint src/components/portal/staff/staff-form.tsx src/lib/actions/staff.ts`
Expected: sạch.

- [ ] **Step 4: Build kiểm tra toàn repo**

Run: `npx next build`
Expected: build thành công (không lỗi type/lint chặn build).

---

### Task 6: Docs — No code before its doc

**Files:**
- Modify: `docs/features/portal/roster-shifts.md`
- Modify: `docs/features/marketing/today-roster.md`
- Modify: `docs/03-data-model.md`

- [ ] **Step 1: `roster-shifts.md`** — thêm mục ngắn: roster grid + duty export hiển thị `preferred_name` thay tên khi có (fallback `name`); nhập ở Staff form (field "Preferred name"); on-call row cũng dùng preferred; initials giữ theo tên thật.

- [ ] **Step 2: `today-roster.md`** — thêm mục: `/today` (on-duty + on-call strip) hiển thị preferred name qua RPC `today_on_duty`/`today_on_call` (coalesce `preferred_name`), migration `0023`.

- [ ] **Step 3: `03-data-model.md`** — thêm cột `staff.preferred_name text` (nullable, optional preferred display name) vào mô tả bảng `staff`.

- [ ] **Step 4: Đọc lại 3 file** đảm bảo khớp code vừa viết (tên cột, tên field form, tên RPC).

---

### Task 7: Cập nhật master plan + bàn giao verify

**Files:**
- Modify: `plans/20260720-master-plan-victoria-mt-eden.md`

- [ ] **Step 1: Chuyển luồng H sang done-code + open items verify**

Trong master plan:
- Bảng tổng quan: đổi dòng H từ "⏳ backlog — chờ quyết định" → "✅ done code; verify DB manual".
- Thêm mục open items "Luồng H — Preferred name (bạn chạy manual)" với checklist:
  - [ ] Apply `supabase/migrations/0023_staff_preferred_name.sql` (không cần 0022 riêng — 0023 supersede).
  - [ ] Seed 1 staff có `preferred_name` → `/portal/roster`, Export, `/today`: thấy preferred ở cả 3 (kể cả on-call nếu set); Staff Team tab + initials vẫn tên thật.
  - [ ] Staff không có preferred → vẫn hiện `name` (fallback).
  - [ ] Sửa preferred qua Staff form → refresh → 3 màn đổi theo.
- Track log: thêm dòng ngày 2026-07-22 mô tả H code xong (scope, files, migration 0023 supersede 0022).
- Ghi chú E-v8/E-v9: 0022 nay superseded bởi 0023 — apply 0023 thay cho 0022 (0023 gồm cả role+building fix).

- [ ] **Step 2: Verify gate cuối**

Run: `npx tsc --noEmit && npx eslint . && npx next build`
Expected: tất cả sạch.

- [ ] **Step 3: Bàn giao cho user** — liệt kê việc manual còn lại (apply 0023 + test 4 điểm ở Step 1). Không commit (theo git rule).

---

## Ghi chú thực thi

- Thứ tự task: 1 → 2 → 3/4 (song song được, độc lập file) → 5 → 6 → 7. Task 3 & 4 đều consume Task 2.
- Không có unit-test harness cho luồng này; "test" = `tsc`/eslint/`next build` sạch + verify DB manual (user). Đây là pattern nhất quán với các luồng A5/D/E/F/G/J trước đó.
