# Staff (Administration) - new screen, full-stack (design)

- **Date:** 2026-07-14
- **Status:** Draft - awaiting user review
- **Screen:** Portal · **new** route `/portal/staff` (Administration group)
- **Design source:** `.design-src/victoria-at-mt-eden.dc.html` (`pStaff` block, markup 1315–1382; modals ~1786–1872, 1946–1959; logic 2010–2231). **Caveat:** the staff `renderVals()` block + the Leave-tab body + the add-shift/add-leave modals sit **past the 256 KB fetch cap**, so those parts are high-confidence reconstructions (marked ⚠️ below).
- **Backend scope (agreed):** Full-stack, following the residents/stock pattern.

## 1. Goal

Add a new **Administration → Staff** screen: a staff directory with leave balances, shift-template management, and a leave-request approval workflow. No `/portal/staff` route exists today. The `staff` table is already live (10 seeded rows from the core migration); this extends it and adds two tables.

## 2. Screen layout

- Route `/portal/staff` + nav entry in `PORTAL_ADMIN_NAV` (`src/lib/portal-nav.ts`), icon `staff` (add if missing).
- Header: eyebrow `Administration`, title `Staff`, subtitle `{building} · manage your team and shift coverage`, action button `+ Add staff`.
- KPI row (4 cards) ⚠️ default: **Total staff / On shift today (Active) / On leave / Pending requests**.
- Sub-tabs (pill bar, `staffTab` default `team`): **Team · Shift templates · Leave requests**.

### Team tab
Directory table, columns: **Name** (avatar + name + `Since {start}`) · **Role** · **Wing** · **Contract** (pill + `{hours} hrs/wk`) · **Contact** (phone) · **Status** (dot + label) · actions (edit / delete). ⚠️ The design's table does **not** render the `annual`/`taken` leave balance - see decision #4.

### Shift templates tab
Two-column cards: swatch + name + time, a **gap badge** (`{n} open` / `Fully staffed`), and a **coverage bar** (`{filled}/{req}`). Add via header (`+ Add shift`), edit per card. `saveShift` upserts.

### Leave requests tab ⚠️ (body reconstructed)
Rows: avatar + `{name} · {type}`, date range, `{days} days`, status pill, note. Actions **Approve** (green) / **Decline** (outline). **Approve debits the staffer's `taken`** by `days` for `Annual leave`/`Sick leave` (not for `Shift swap`). Add via `+ Add leave`.

## 3. Data model - migration `supabase/migrations/0003_staff_admin.sql`

Extend the **existing** `staff` table + two new tables. RLS `_read`/`_write` (authenticated), same posture as residents/stock.

```sql
alter table public.staff
  add column if not exists contract   text,      -- Full-time | Part-time | Casual
  add column if not exists hours       int,
  add column if not exists phone       text,
  add column if not exists start_label text,      -- e.g. 'Mar 2021'
  add column if not exists annual      int not null default 20,
  add column if not exists taken       int not null default 0;

shift_templates(id text pk, building_id text→buildings, name, time_label,
                req int, filled int, color, tint, border, created_at)

leave_requests(id uuid pk, building_id text→buildings,
               staff_id uuid→staff on delete cascade,
               type text,            -- Annual leave | Sick leave | Shift swap
               from_date date, to_date date, days int,
               status text default 'Pending',   -- Pending | Approved | Declined
               note text, created_at)
```

**Seed** (`scripts/db/seed-staff.mts`, pg-direct, idempotent): backfill `contract/hours/phone/start_label/annual/taken` on the 10 existing `staff` rows from the design's `staffTeam` seed (match by name); seed 6 `shift_templates` + 4 `leave_requests` from `staffTemplates`/`leaveDefs`.

## 4. Backend layer

- `src/lib/data/staff.ts` - `getStaff()`, `getShiftTemplates()`, `getLeaveRequests()`.
- `src/lib/actions/staff.ts` - `saveStaff`/`deleteStaff`, `saveShiftTemplate`/`deleteShiftTemplate`, `saveLeave`, `approveLeave`, `declineLeave`. `approveLeave` sets status `Approved` and, for Annual/Sick, increments the matched staff's `taken` by `days` (atomic - do it in one RPC `approve_leave(p_id)` for consistency, mirroring stock's RPC approach).

## 5. Frontend

RSC `src/app/portal/staff/page.tsx` awaits the three accessors → `StaffView` client island. Components under `src/components/portal/staff/`:
- `staff-view.tsx` - header + KPI row + sub-tabs + modal state.
- `team-tab.tsx` - directory table + row actions.
- `shift-templates-tab.tsx` - template cards + coverage bars.
- `leave-tab.tsx` - leave rows + approve/decline.
- `staff-form.tsx` - add/edit staff modal (name, role choice-grid, contract choice-grid, wing select, phone). ⚠️ `hours` derived from contract on save (Full-time 40 / Part-time 24 / Casual 12) unless a field is added; `annual` defaults 20.
- `shift-template-form.tsx` ⚠️, `leave-form.tsx` ⚠️ (reconstructed modals).
- Reuse the stock `confirm-delete-modal.tsx` (or a shared one) for staff/shift/leave deletes.

Add a `staff` nav item; `loading.tsx` skeleton to match the other portal routes.

## 6. Types (`src/types/domain.ts`)

Extend `StaffMember` (or add `StaffRecord`) with `contract/hours/phone/start/annual/taken/status`. Add `ShiftTemplate { id,name,time,req,filled,color,tint,border }` and `LeaveRequest { id,staffId,name,initials,color,type,from,to,days,status,note }` (note: a `LeaveRequest` type already exists for the roster's inert list - reconcile: rename the old one or extend).

## 7. Decisions (defaults - flag any to change)

1. **New route** `/portal/staff` in the Administration nav group (admin-only), between Users & access and Buildings. ⚠️ confirm placement.
2. **`staffKpis`** labels (past the cap) → **Total staff / On shift today / On leave / Pending requests**. Confirm.
3. **`hours`** isn't a modal field in the design → derive from contract (FT 40 / PT 24 / Casual 12). Confirm, or add a field.
4. **Leave balance display:** the design's Team table omits `annual`/`taken`. Default: **add a "Leave" column** showing `{taken}/{annual}` so the balance the approval workflow mutates is visible. (Alternative: keep it off-table, show only in the Leave tab.) Confirm.
5. **Leave-tab body + add-shift/add-leave modals** are reconstructed from the seed shapes + verified handlers - will match the app's tokens; confirm against the live design if you can share a screenshot.
6. **Roster stays as-is:** the roster's existing "Leave & requests" list remains inert; real approval lives here (matches the design).

## 8. Non-goals (this pass)

Linking leave to the roster grid (auto-marking a rostered shift as covered); per-role permissions beyond authenticated `_read`/`_write`; multi-building; editing the roster from this screen.

## 9. Definition of done

Migration `0003` written (+ applied/seeded when DB reachable); `/portal/staff` renders the three tabs from Supabase; add/edit/delete staff, shift-template CRUD, and approve/decline (debiting `taken`) all work via server actions; nav entry + loading skeleton added; `tsc`/`lint`/`build` clean; docs updated (`03-data-model.md`, new `docs/features/portal/staff.md`).

## 10. Open questions

1. Decisions #1–#5 above (nav placement, KPI labels, hours derivation, leave-balance column, reconstructed modals).
2. Same DB-connectivity caveat as Stock - migration/seed run deferred until the DB is reachable (IPv4 pooler URL or local run).
