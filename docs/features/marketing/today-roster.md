# Today roster — public duty board (`/today`)

**Screen:** Claude Design "Wesley MtEden" `Victoria at Mt Eden.dc.html` (`section=site&sitePage=today`), board `Victoria - Landing.dc.html` frame **U1**, **v3.0**.
**Route:** `/today` (public, top-level `src/app/today/` — outside the `(marketing)` group so it renders full-page with **no site nav / announcement bar / footer**; middleware only guards `/portal` + `/login`).

## Purpose

Reception-iPad board showing today's on-duty staff by building (Wesley / The Lodge), grouped by role band, with a live clock. Full-page (no site chrome), no login. The white A4 sheet is the **same document** the roster duty-export prints (`DutySheetDocument`), so board and printout render pixel-identical.

## Data flow

- **Source:** RPC `public.today_on_duty()` — `SECURITY DEFINER`, `grant execute to anon`. Joins `roster_shifts → staff → shift_templates`, filtered to **today in NZ time** `(now() at time zone 'Pacific/Auckland')::date`. Returns only `building_id, role, staff_name, shift_time` (no contact/pay data). Both `role` and `building_id` come from the **shift's template** (`coalesce(nullif(st.role,''), s.role)` and `coalesce(st.building_id, rs.building_id)`) so a shift lands under its own role band and in its own building column — matching the duty-export sheet. Splitting by `rs.building_id` (the roster page's own building, always e.g. 'wesley') instead left The Lodge column empty. Migrations: `0016_today_on_duty.sql` (initial), `0022_today_on_duty_shift_role.sql` (group by shift's role + building).
- **On-call source (2026-07-20):** RPC `public.today_on_call()` — same `SECURITY DEFINER` + anon grant pattern, joins `roster_on_call → staff`, filtered to today NZ. Returns `building_id, staff_name` only. Migration: `supabase/migrations/0018_today_on_call.sql`.
- **Preferred name (2026-07-22):** both `staff_name` outputs use `coalesce(nullif(s.preferred_name,''), s.name)` — a staffer's preferred name shows in place of their legal name (on-duty rows + on-call strip), falling back to `name` when unset. Migration `supabase/migrations/0023_staff_preferred_name.sql` recreates both `today_on_duty` (final version: keeps the role + building split) and `today_on_call`; it **supersedes** `0022` (apply 0023 instead).
- **Read:** `src/lib/data/today-on-duty.ts` (`getTodayOnDuty`, `getTodayOnCall`) calls the RPCs via the anon server client.
- **Group:** `src/lib/today-board.ts` (`buildTodayBoard(rows, onCallRows)`) maps raw rows into bands (NURSE / A/C / HCA / CARE TAKER, then Kitchen), each split Wesley (left) | The Lodge (right). Roles matching no band fall into a trailing "OTHER" band. Dual-segment shifts (`" + "`) split into one line each. `onCall` on the returned sheet is the Wesley on-call name (the only building the on-call picker tracks); `""` if unset for today.
- **Route:** `src/app/today/page.tsx` (`force-dynamic`, top-level — not in `(marketing)`) — fetches both rpcs in parallel.
- **Render:** `src/components/marketing/today-board.tsx` — client component; renders the live `HH:MM` status bar (clock ticks every 15s; full date + sheet date from the device clock) above the shared `DutySheetDocument` (`src/components/portal/roster/duty-sheet-document.tsx`). The sheet — masthead, building header, on-call strip, role bands, Kitchen band, footer date — is the single component the duty-export preview also renders.

## Decisions

- **The Lodge:** keep 2 columns; a column with no shifts shows `—`. Lodge shifts come from staff assigned a shift whose **template** `building_id = 'lodge'` (the roster grid offers all buildings' templates), surfaced via the RPC's `coalesce(st.building_id, rs.building_id)`.
- **Clock:** computed client-side (reception iPad set to NZ time).
- **Band mapping:** by `staff.role` substring; adjust `BANDS` in `today-board.ts` if real role values differ.
- **Masthead/footer text:** eyebrow is "Wesley Home & Care" (the org's public brand, used everywhere else in the app - nav, footer, login, `layout.tsx`), not the design's literal facility name; footer shows only the date, right-aligned. Lives in `DutySheetDocument`, so board and export stay in sync automatically.
- **Shared document (2026-07-22):** the board's white A4 sheet and the roster duty-export sheet were unified into one `DutySheetDocument`; the old `duty-roster-sheet.tsx` was removed. `TodayBoardSheet` reuses the export's `DutySection`/`DutyRow` types. Kitchen is one band shared across both buildings (fills the Wesley column, Lodge blank) on both surfaces.
- **Full-page (2026-07-22):** `/today` moved from `(marketing)` to top-level `src/app/today/` so the reception board fills the screen with no announcement bar / site nav / footer — just the duty roster.
- **Mobile layout (2026-07-22):** `DutySheetDocument` takes an optional `compact` prop — a fluid, smaller-type/spacing rendering used below 640px viewport width instead of the fixed 794px A4 replica (which otherwise overflowed on phones). `today-board.tsx` decides `compact` via `matchMedia`, a JS check rather than a Tailwind breakpoint, so the print-identical export preview (which never passes `compact`) can't have its layout depend on the browser window's width at print time. Building/role-band structure and 2-column split are unchanged in compact mode — only sizing.

## Verify

- `scripts/db/verify-today-on-duty-rpc.mts` — anon can call the RPC + row shape.
- `scripts/db/verify-today-board-e2e.mts` — seed a shift dated today → anon RPC returns it.
- `scripts/db/verify-today-on-call-rpc.mts` — anon can call `today_on_call` + row shape.
- `scripts/db/verify-today-on-call-e2e.mts` — seed a `roster_on_call` row dated today → anon RPC returns it.

## Design spec / plan

- Spec: [today-roster-design.md](../../superpowers/specs/2026-07-20-today-roster-design.md)
- Plan: [today-roster-public-page.md](../../superpowers/plans/2026-07-20-today-roster-public-page.md)
