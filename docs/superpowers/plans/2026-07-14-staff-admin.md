# Staff (Administration) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a new `/portal/staff` Administration screen — staff directory with leave balances, shift-template CRUD, and a leave approve/decline workflow — persisted in Supabase.

**Architecture:** Mirrors the just-shipped Stock feature and residents: a `tsx` script applies the DDL + seeds; async data layer reads under RLS; server actions write under RLS; the RSC page awaits data → `StaffView` client island. The live `staff` table is **extended** (not recreated); two new tables are added.

**Tech Stack:** Next.js 16 (App Router, RSC + server actions), `@supabase/ssr` + `@supabase/supabase-js`, `pg` (seed/verify via `npx tsx`), Tailwind tokens (`src/lib/design-meta.ts`).

**Spec:** `docs/superpowers/specs/2026-07-14-staff-admin-fullstack-design.md`

## Global Constraints

- **Git:** do NOT branch or commit unless the user asks. `Commit` steps are checkpoints — leave changes uncommitted.
- **No test framework:** "tests" are `tsx` verify scripts (pg-direct via `DIRECT_URL`, like `scripts/db/seed-stock.mts`) + `npx tsc --noEmit` + `npm run lint` + `npm run build`. **The DB is currently unreachable from the build environment** (IPv6-only direct host) — so **do NOT run any DB command**; write the seed/verify scripts but gate only on tsc/lint/build. The user runs the DB batch on their machine.
- **Follow the Stock feature verbatim as the reference** (`supabase/migrations/0002_stock_procurement.sql`, `scripts/db/seed-stock.mts`, `src/lib/data/stock.ts`, `src/lib/actions/stock.ts`, `src/components/portal/stock/*`).
- **Building scope:** `building_id = 'wesley'`.
- **RLS:** `<table>_read` select/authenticated; `<table>_write` all/authenticated with check(true).
- **Strict lint:** `@typescript-eslint/no-explicit-any` and `no-unused-vars` are errors; `eslint-plugin-react-hooks` forbids synchronous `setState` in a `useEffect` body — drive state from events; reset modals via the `key=` remount idiom used across `src/components/portal/stock/`.
- **No plan/phase references in code, comments, or migration filenames.**
- **Type collision:** an existing `LeaveRequest` type (roster) must NOT be changed — use new names `StaffRecord`, `ShiftTemplate`, `StaffLeaveRequest`.

---

## File Structure

**Create:** `supabase/migrations/0003_staff_admin.sql`, `scripts/db/seed-staff.mts`, `scripts/db/verify-staff-read.mts`, `scripts/db/verify-staff-write.mts`, `src/lib/data/staff.ts`, `src/lib/actions/staff.ts`, `src/app/portal/staff/page.tsx`, `src/app/portal/staff/loading.tsx`, `src/components/portal/staff/{staff-view,team-tab,shift-templates-tab,leave-tab,staff-form,shift-template-form,leave-form}.tsx`.
**Modify:** `src/types/domain.ts` (add types), `src/lib/portal-nav.ts` (nav entry), `src/components/shared/icons.tsx` (add `staff` glyph), `docs/03-data-model.md`, plus new `docs/features/portal/staff.md`.
**Reuse:** `src/components/portal/stock/confirm-delete-modal.tsx` (import it, or copy to a shared location).

---

## Task 1: Migration + approve_leave RPC + seed

**Files:** Create `supabase/migrations/0003_staff_admin.sql`, `scripts/db/seed-staff.mts`. Read for context: `supabase/migrations/0002_stock_procurement.sql`, `scripts/db/seed-stock.mts`.

**Interfaces produced:** columns on `staff` (`contract,hours,phone,start_label,annual,taken`); tables `shift_templates`, `leave_requests`; function `approve_leave(uuid)`.

- [ ] **Step 1: Write `supabase/migrations/0003_staff_admin.sql`**

```sql
-- Staff admin: extend staff with employment + leave-balance fields; add shift
-- templates and leave requests. Approving Annual/Sick leave debits staff.taken.

alter table public.staff
  add column if not exists contract   text,
  add column if not exists hours       int,
  add column if not exists phone       text,
  add column if not exists start_label text,
  add column if not exists annual      int not null default 20,
  add column if not exists taken       int not null default 0;

create table if not exists public.shift_templates (
  id          text primary key,
  building_id text references public.buildings(id),
  name        text not null,
  time_label  text,
  req         int not null default 1,
  filled      int not null default 0,
  color       text, tint text, border text,
  created_at  timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id          uuid primary key default gen_random_uuid(),
  building_id text references public.buildings(id),
  staff_id    uuid references public.staff(id) on delete cascade,
  type        text not null,                 -- Annual leave | Sick leave | Shift swap
  from_date   date, to_date date, days int not null default 1,
  status      text not null default 'Pending',  -- Pending | Approved | Declined
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.shift_templates enable row level security;
alter table public.leave_requests  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['shift_templates','leave_requests']
  loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Approve a request; for Annual/Sick leave, debit the staffer's taken balance. Atomic.
create or replace function public.approve_leave(p_id uuid)
returns void language plpgsql security invoker as $$
declare v public.leave_requests;
begin
  select * into v from public.leave_requests where id = p_id;
  if not found or v.status = 'Approved' then return; end if;
  update public.leave_requests set status = 'Approved' where id = p_id;
  if v.type in ('Annual leave','Sick leave') then
    update public.staff set taken = coalesce(taken,0) + coalesce(v.days,0) where id = v.staff_id;
  end if;
end $$;

grant execute on function public.approve_leave(uuid) to authenticated;
```

- [ ] **Step 2: Write `scripts/db/seed-staff.mts`** (copy `readEnv`/`pgConfig` from `scripts/db/seed-stock.mts`; apply `0003` DDL, then:)

```ts
const B = "wesley";
// Extended fields for the 10 already-seeded staff (match by name).
const team = [
  { name: "Aroha Ngata",  role: "Registered Nurse", wing: "Rātā",      contract: "Full-time", hours: 40, phone: "021 555 012", start: "Mar 2021", status: "Active",   annual: 20, taken: 6 },
  { name: "David Cho",    role: "Registered Nurse", wing: "Kōwhai",    contract: "Full-time", hours: 40, phone: "021 555 034", start: "Aug 2020", status: "Active",   annual: 20, taken: 4 },
  { name: "Mere Solomon", role: "Team Leader",      wing: "Rātā",      contract: "Full-time", hours: 38, phone: "021 555 056", start: "Jan 2019", status: "Active",   annual: 20, taken: 12 },
  { name: "Tomasi Fifita",role: "Carer",            wing: "Kōwhai",    contract: "Full-time", hours: 40, phone: "021 555 078", start: "Feb 2022", status: "Active",   annual: 20, taken: 8 },
  { name: "Hong Le",      role: "Carer",            wing: "Tōtara",    contract: "Part-time", hours: 24, phone: "021 555 090", start: "Jun 2022", status: "Active",   annual: 16, taken: 5 },
  { name: "Candy Tian",   role: "Carer",            wing: "Rātā",      contract: "Part-time", hours: 20, phone: "021 555 102", start: "Sep 2023", status: "On leave", annual: 16, taken: 14 },
  { name: "Priya Nair",   role: "Carer",            wing: "Kōwhai",    contract: "Casual",    hours: 12, phone: "021 555 124", start: "Nov 2023", status: "Active",   annual: 8,  taken: 2 },
  { name: "Grace Lin",    role: "Activities",       wing: "All wings", contract: "Part-time", hours: 24, phone: "021 555 146", start: "Apr 2021", status: "Active",   annual: 16, taken: 7 },
  { name: "Vo Hoang Lam", role: "Carer",            wing: "Tōtara",    contract: "Full-time", hours: 40, phone: "021 555 168", start: "Jul 2022", status: "Active",   annual: 20, taken: 9 },
  { name: "LE Anh Thang", role: "Carer",            wing: "Tōtara",    contract: "Casual",    hours: 10, phone: "021 555 180", start: "Feb 2024", status: "Active",   annual: 8,  taken: 1 },
];
for (const s of team) {
  const r = await client.query(
    `update public.staff set role=$2, wing=$3, contract=$4, hours=$5, phone=$6, start_label=$7, status=$8, annual=$9, taken=$10
     where name=$1 and building_id=$11`,
    [s.name, s.role, s.wing, s.contract, s.hours, s.phone, s.start, s.status, s.annual, s.taken, B]);
  if (r.rowCount === 0) {
    const initials = s.name.split(/\s+/).map((w) => w[0]).slice(0,2).join("").toUpperCase();
    await client.query(
      `insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
       values ($1,$2,$3,$4,$5,'#6E875E',$6,$7,$8,$9,$10,$11,$12)`,
      [B, s.name, s.role, s.wing, initials, s.status, s.contract, s.hours, s.phone, s.start, s.annual, s.taken]);
  }
}
const shifts = [
  ["sh1","Morning","6:45 – 15:15",4,4,"#87651A","#FCF4DC","#EAD9A4"],
  ["sh2","Morning + Stock","6:45 – 17:15",1,1,"#8A6516","#FBEFC8","#E7CE8A"],
  ["sh3","Afternoon","14:45 – 22:15",3,2,"#9A4A70","#F7DFEA","#E5B2CB"],
  ["sh4","Evening (split)","8:30 – 21:00",2,2,"#A24E2A","#F7DDCC","#E8AE88"],
  ["sh5","Night","23:45 – 8:15",2,1,"#3B4E74","#E3E8F5","#B4C1DF"],
  ["sh6","Team Leader","8:00 – 22:45",2,2,"#2C5A6E","#D8EAF0","#9FC5D4"],
];
for (const [id,name,time,req,filled,c,t,b] of shifts) {
  await client.query(
    `insert into public.shift_templates (id, building_id, name, time_label, req, filled, color, tint, border)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     on conflict (id) do update set name=excluded.name, time_label=excluded.time_label, req=excluded.req,
       filled=excluded.filled, color=excluded.color, tint=excluded.tint, border=excluded.border`,
    [id,B,name,time,req,filled,c,t,b]);
}
// leave requests (staff_id resolved by name)
await client.query(`delete from public.leave_requests where building_id=$1`, [B]);
const leaves = [
  ["Mere Solomon","Annual leave","2026-07-18","2026-07-25",5,"Pending","Family trip"],
  ["Tomasi Fifita","Shift swap","2026-07-20","2026-07-20",1,"Pending","Swap Sun PM → Ana Reti"],
  ["Priya Nair","Sick leave","2026-07-14","2026-07-14",1,"Pending","Afternoon covered"],
  ["Candy Tian","Annual leave","2026-07-01","2026-07-12",8,"Approved",""],
];
for (const [name,type,from,to,days,status,note] of leaves) {
  await client.query(
    `insert into public.leave_requests (building_id, staff_id, type, from_date, to_date, days, status, note)
     select $1, s.id, $3, $4, $5, $6, $7, $8 from public.staff s where s.name=$2 and s.building_id=$1`,
    [B,name,type,from,to,days,status,note]);
}
```
End with a counts `console.table` (staff / shift_templates / leave_requests).

- [ ] **Step 3 (DEFERRED — DB unreachable):** the run command is `npx tsx scripts/db/seed-staff.mts` (expect staff 10, shift_templates 6, leave_requests 4). Do NOT run now; document it in the report as deferred.
- [ ] **Step 4: Gate** — there is no code to typecheck here except the `.mts` (which uses no `@/` app imports). Run `npx tsc --noEmit` to confirm the repo still compiles. Commit step skipped (git rule).

---

## Task 2: Types + data layer

**Files:** Modify `src/types/domain.ts`; create `src/lib/data/staff.ts`, `scripts/db/verify-staff-read.mts`. Read: `src/lib/data/stock.ts`.

**Interfaces produced:** `StaffRecord`, `ShiftTemplate`, `StaffLeaveRequest`; `getStaff()`, `getShiftTemplates()`, `getLeaveRequests()`.

- [ ] **Step 1: Add types to `src/types/domain.ts`** (do NOT touch the existing `LeaveRequest`/`StaffMember`):

```ts
export interface StaffRecord {
  id: string; name: string; role: string; wing: string;
  contract: string; hours: number; phone: string; start: string;
  status: string; initials: string; color: string;
  annual: number; taken: number;
}
export interface ShiftTemplate {
  id: string; name: string; time: string; req: number; filled: number;
  color: string; tint: string; border: string;
}
export interface StaffLeaveRequest {
  id: string; staffId: string; name: string; initials: string; color: string;
  type: string; from: string; to: string; days: number; status: string; note: string;
}
```

- [ ] **Step 2: Write `src/lib/data/staff.ts`** — async accessors mapping snake→camel (mirror `src/lib/data/stock.ts` exactly for the client + error pattern):

```ts
import { createClient } from "@/lib/supabase/server";
import type { StaffRecord, ShiftTemplate, StaffLeaveRequest } from "@/types/domain";
const BUILDING = "wesley";

export async function getStaff(): Promise<StaffRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("staff")
    .select("id,name,role,wing,contract,hours,phone,start_label,status,initials,color,annual,taken")
    .eq("building_id", BUILDING).order("name");
  if (error) throw new Error(`Failed to load staff: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, role: r.role ?? "", wing: r.wing ?? "",
    contract: r.contract ?? "", hours: r.hours ?? 0, phone: r.phone ?? "",
    start: r.start_label ?? "", status: r.status ?? "Active",
    initials: r.initials ?? "", color: r.color ?? "#6E875E",
    annual: r.annual ?? 0, taken: r.taken ?? 0,
  }));
}
export async function getShiftTemplates(): Promise<ShiftTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("shift_templates")
    .select("id,name,time_label,req,filled,color,tint,border").eq("building_id", BUILDING).order("id");
  if (error) throw new Error(`Failed to load shift templates: ${error.message}`);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, time: r.time_label ?? "",
    req: r.req, filled: r.filled, color: r.color ?? "#87651A", tint: r.tint ?? "#FCF4DC", border: r.border ?? "#EAD9A4" }));
}
export async function getLeaveRequests(): Promise<StaffLeaveRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leave_requests")
    .select("id,type,from_date,to_date,days,status,note,staff(id,name,initials,color)")
    .eq("building_id", BUILDING).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load leave requests: ${error.message}`);
  return (data ?? []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- nested embed row shape isn't inferred
    const s = (Array.isArray((r as any).staff) ? (r as any).staff[0] : (r as any).staff) ?? {};
    return { id: r.id, staffId: s.id ?? "", name: s.name ?? "", initials: s.initials ?? "", color: s.color ?? "#6E875E",
      type: r.type, from: r.from_date ?? "", to: r.to_date ?? "", days: r.days ?? 0, status: r.status ?? "Pending", note: r.note ?? "" };
  });
}
```

- [ ] **Step 3: Write `scripts/db/verify-staff-read.mts`** (pg-direct, mirror `scripts/db/verify-stock-read.mts`): counts for `staff`, `shift_templates`, `leave_requests`; one join `select l.type, s.name from leave_requests l join staff s on s.id=l.staff_id limit 1`. Do NOT run.
- [ ] **Step 4: Gate** `npx tsc --noEmit` (0) + `npm run lint` (clean on touched files). Commit skipped.

---

## Task 3: Server actions

**Files:** Create `src/lib/actions/staff.ts`, `scripts/db/verify-staff-write.mts`. Read: `src/lib/actions/stock.ts`.

**Interfaces produced:** `saveStaff`, `deleteStaff`, `saveShiftTemplate`, `deleteShiftTemplate`, `saveLeave`, `approveLeave`, `declineLeave` (all `"use server"`, `revalidatePath("/portal/staff")`).

- [ ] **Step 1: Write `src/lib/actions/staff.ts`** — mirror `src/lib/actions/stock.ts` (same `str`/`num` helpers, `StaffFormState { error?: string }`):
  - `saveStaff(prev, fd)`: hidden `id`; require `name`; `role`, `wing`, `contract`, `phone`; derive `hours` from contract (`Full-time`→40, `Part-time`→24, `Casual`→12); `initials` from name; `annual` default 20 (keep existing on edit); upsert `staff` with `building_id`. On insert set `taken` 0.
  - `deleteStaff(fd)`: delete by id.
  - `saveShiftTemplate(prev, fd)`: hidden `id` (or generate `sh-${Date.now()}`); `name`, `time_label` (from start/end or a single field), `req`, `filled`, `color`/`tint`/`border` (pick a palette entry by color); upsert.
  - `deleteShiftTemplate(fd)`: delete by id.
  - `saveLeave(prev, fd)`: `staffId` (or resolve by name), `type`, `from`, `to`, `days`, `note`; insert `leave_requests` status `Pending`.
  - `approveLeave(fd)`: `id` → `supabase.rpc("approve_leave", { p_id: id })`.
  - `declineLeave(fd)`: `id` → `update leave_requests set status='Declined'`.

- [ ] **Step 2: Write `scripts/db/verify-staff-write.mts`** (pg-direct, mirror `verify-stock-write.mts`): create a temp staff row, a Pending Annual-leave request for it with `days=3`, capture the staffer's `taken`, call `select public.approve_leave(<id>)`, assert `taken` increased by 3 and status is `Approved`; then clean up (delete leave, staff). Do NOT run.
- [ ] **Step 3: Gate** `npx tsc --noEmit` (0) + `npm run lint` (clean). Commit skipped.

---

## Task 4: RSC page + StaffView shell + nav + icon + loading

**Files:** Create `src/app/portal/staff/page.tsx`, `src/app/portal/staff/loading.tsx`, `src/components/portal/staff/staff-view.tsx`. Modify `src/lib/portal-nav.ts`, `src/components/shared/icons.tsx`. Read: `src/app/portal/stock/page.tsx`, `src/components/portal/stock/stock-view.tsx`, an existing `loading.tsx` (e.g. `src/app/portal/users/loading.tsx`), `src/components/shared/portal-page-header.tsx`.

- [ ] **Step 1: Add nav + icon** — in `src/lib/portal-nav.ts` add to `PORTAL_ADMIN_NAV` (after Users & access): `{ href: "/portal/staff", label: "Staff", icon: "staff" }`. In `src/components/shared/icons.tsx` add a `staff` path (a people glyph, lucide-style, matching the existing paths' format).
- [ ] **Step 2: `page.tsx`** (RSC) — `await Promise.all([getStaff(), getShiftTemplates(), getLeaveRequests()])` → `<StaffView staff={...} shifts={...} leaves={...} />`.
- [ ] **Step 3: `loading.tsx`** — a skeleton matching the other portal routes' style.
- [ ] **Step 4: `staff-view.tsx`** — client island: props `{ staff, shifts, leaves }`; `PortalPageHeader` with eyebrow `Administration`, title `Staff`, sub `{building} · manage your team and shift coverage`; header action `+ Add staff`; KPI row (4: Total staff / On shift today = `status==='Active'` / On leave = `status==='On leave'` / Pending requests = `leaves.filter(status==='Pending')`); pill sub-tabs `team|shifts|leave` (`useState`); render each tab body as a **placeholder** for now; modal state scaffolding added in Tasks 5–7.
- [ ] **Step 5: Gate** `npx tsc --noEmit` + `npm run lint` + `npm run build` (the route is dynamic; build passes without a DB). Commit skipped.

---

## Task 5: Team tab + Leave column + staff form

**Files:** Create `src/components/portal/staff/team-tab.tsx`, `src/components/portal/staff/staff-form.tsx`. Modify `staff-view.tsx`. Reuse `src/components/portal/stock/confirm-delete-modal.tsx`. Read: `.design-src/victoria-at-mt-eden.dc.html` lines 1339–1361 (team table) + 1786–1831 (staff modal); `src/components/portal/stock/stock-item-form.tsx` (modal pattern); `src/lib/design-meta.ts`.

- [ ] **Step 1: `team-tab.tsx`** — table, columns **Name** (avatar `color`/`initials` + name + `Since {start}`) · **Role** · **Wing** · **Contract** (pill colored by contract: Full-time navy `text-navy`/`bg-navy-tint`, Part-time gold `text-gold-text`/`bg-gold-tint`, Casual `text-ink-muted`/`bg-muted`; sub `{hours} hrs/wk`) · **Leave** (`{taken}/{annual}`, per decision #4) · **Contact** (phone) · **Status** (dot `bg-sage` Active / `bg-amber` On leave + label) · actions (edit `onEdit(s)`, delete `onDelete(s)`). Props: `staff: StaffRecord[]`, callbacks.
- [ ] **Step 2: `staff-form.tsx`** — modal, `useActionState(saveStaff, {})`, hidden `id`; fields: Full name; Role choice-grid (Carer / Registered Nurse / Team Leader / Activities); Contract choice-grid (Full-time / Part-time / Casual); Wing `<select>` (Rātā / Kōwhai / Tōtara / All wings); Phone. Submit "Add staff"/"Save changes"; show `state.error`; `onClose`.
- [ ] **Step 3: wire `staff-view.tsx`** — replace team placeholder with `<TeamTab>`; header `+ Add staff` opens blank form; hold `editStaff: StaffRecord | null` + `confirmDelete` state; delete → confirm modal → `deleteStaff`; surface imperative errors (try/catch → confirm modal `error`, like Stock's fix pass).
- [ ] **Step 4: Gate** tsc + lint + build. Commit skipped.

---

## Task 6: Shift-templates tab + form

**Files:** Create `src/components/portal/staff/shift-templates-tab.tsx`, `src/components/portal/staff/shift-template-form.tsx`. Modify `staff-view.tsx`. Read: `.design-src/...` lines 1365–1378 (template cards); `src/components/portal/stock/provider-form.tsx` (modal).

- [ ] **Step 1: `shift-templates-tab.tsx`** — two-column cards: swatch (`tint`/`border`) + name + time; **gap badge** (`gap = req-filled`; `{gap} open` terracotta `text-rust`/`bg-rust-tint` if gap>0 else `Fully staffed` sage); **coverage bar** track `bg-line` filled to `filled/req` with `bg-sage` (staffed) / `bg-terracotta` (gap); edit button per card. Header `+ Add shift`.
- [ ] **Step 2: `shift-template-form.tsx`** — modal, `useActionState(saveShiftTemplate, {})`; fields name, start + end (time text) OR a single time field, req (number), filled (number), color swatch picker (6 palette entries from the seed). Submit "Add shift"/"Save changes".
- [ ] **Step 3: wire into `staff-view.tsx`** — replace shifts placeholder; header action switches to `+ Add shift` when on the shifts tab; edit/delete via confirm modal → `deleteShiftTemplate`.
- [ ] **Step 4: Gate** tsc + lint + build. Commit skipped.

---

## Task 7: Leave-requests tab + form + approve/decline

**Files:** Create `src/components/portal/staff/leave-tab.tsx`, `src/components/portal/staff/leave-form.tsx`. Modify `staff-view.tsx`. Read: `src/components/portal/roster/leave-request-row.tsx` (existing inert row for visual reference); design leave data shape (spec §2).

- [ ] **Step 1: `leave-tab.tsx`** — rows: avatar + `{name} · {type}`, date range `{from} – {to}`, `{days} days`, status pill (Pending amber `text-amber`/`bg-amber-tint` · Approved navy `text-navy`/`bg-navy-tint` · Declined `text-rust`/`bg-rust-tint`), note; for `Pending` rows show **Approve** (sage) + **Decline** (outline) buttons → `onApprove(id)` / `onDecline(id)`. Header `+ Add leave`.
- [ ] **Step 2: `leave-form.tsx`** — modal, `useActionState(saveLeave, {})`; fields staff `<select>` (from `staff`), type `<select>` (Annual leave / Sick leave / Shift swap), from + to (date), days (number), note. Submit "Add leave".
- [ ] **Step 3: wire into `staff-view.tsx`** — replace leave placeholder; approve/decline call the actions (try/catch + surface errors); `+ Add leave` opens the form.
- [ ] **Step 4: Gate** tsc + lint + build. Commit skipped.

---

## Task 8: Docs + type reconciliation

**Files:** Modify `docs/03-data-model.md`; create `docs/features/portal/staff.md`. Verify no `LeaveRequest`/`StaffMember` regressions.

- [ ] **Step 1:** `docs/features/portal/staff.md` — document the new screen (3 tabs, CRUD, approve/decline debits `taken`, Supabase flow via `data/staff.ts` + `actions/staff.ts` + `approve_leave` RPC).
- [ ] **Step 2:** `docs/03-data-model.md` — add the extended `staff` columns + `shift_templates` + `leave_requests` tables + `approve_leave` RPC as LIVE (deferred apply noted).
- [ ] **Step 3:** `grep -rn "StaffMember\|LeaveRequest\b" src/` — confirm the roster's original `LeaveRequest`/`StaffMember` usages still compile untouched (new types are `StaffRecord`/`ShiftTemplate`/`StaffLeaveRequest`).
- [ ] **Step 4: Gate** `npx tsc --noEmit` + `npm run lint` + `npm run build` all clean.

---

## Self-Review

**Spec coverage:** §2 layout → Tasks 4–7 ✓ · §3 schema → Task 1 ✓ · §4 backend → Tasks 2–3 ✓ · §5 frontend (all tabs + modals + nav + loading) → Tasks 4–7 ✓ · §6 types → Task 2 ✓ · §7 decisions (nav, KPIs, hours-derive, **Leave column**, reconstructed modals) → Tasks 4–7 ✓ · §9 DoD → Tasks 1–8 ✓.

**Placeholder scan:** backend tasks carry complete code (migration, seed data, data layer, action signatures, verify shapes); frontend tasks carry exact columns/fields/tokens and reference the now-existing Stock components as adaptation sources. No `TBD`/"similar to".

**Type consistency:** new types `StaffRecord`/`ShiftTemplate`/`StaffLeaveRequest` defined in Task 2, consumed unchanged in Tasks 3–7; action names stable; `approve_leave` RPC arg (`p_id`) matches between migration, `verify-staff-write`, and `approveLeave`.

## Open items
1. All DB apply/seed/verify runs are **deferred** (DB unreachable from build env) — same batch-on-your-machine handoff as Stock, plus `npx tsx scripts/db/seed-staff.mts`.
2. Reconstructed leave-tab/modals (past 256 KB cap) built to app tokens — confirm against a live screenshot if available.
