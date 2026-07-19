# Today roster — public duty board (`/today`)

**Screen:** Claude Design "Wesley MtEden" `Victoria at Mt Eden.dc.html` (`section=site&sitePage=today`), board `Victoria - Landing.dc.html` frame **U1**, **v3.0**.
**Route:** `/today` (public, in `(marketing)` — middleware only guards `/portal` + `/login`).

## Purpose

Reception-iPad board showing today's on-duty staff by building (Wesley / The Lodge), grouped by role band, with a live clock. No login.

## Data flow

- **Source:** RPC `public.today_on_duty()` — `SECURITY DEFINER`, `grant execute to anon`. Joins `roster_shifts → staff → shift_templates`, filtered to **today in NZ time** `(now() at time zone 'Pacific/Auckland')::date`. Returns only `building_id, role, staff_name, shift_time` (no contact/pay data). Migration: `supabase/migrations/0016_today_on_duty.sql`.
- **On-call source (2026-07-20):** RPC `public.today_on_call()` — same `SECURITY DEFINER` + anon grant pattern, joins `roster_on_call → staff`, filtered to today NZ. Returns `building_id, staff_name` only. Migration: `supabase/migrations/0018_today_on_call.sql`.
- **Read:** `src/lib/data/today-on-duty.ts` (`getTodayOnDuty`, `getTodayOnCall`) calls the RPCs via the anon server client.
- **Group:** `src/lib/today-board.ts` (`buildTodayBoard(rows, onCallRows)`) maps raw rows into bands (NURSE / A/C / HCA / CARE TAKER, then Kitchen), each split Wesley (left) | The Lodge (right). Roles matching no band fall into a trailing "OTHER" band. Dual-segment shifts (`" + "`) split into one line each. `onCall` on the returned sheet is the Wesley on-call name (the only building the on-call picker tracks); `""` if unset for today.
- **Route:** `src/app/(marketing)/today/page.tsx` (`force-dynamic`) — fetches both rpcs in parallel.
- **Render:** `src/components/marketing/today-board.tsx` — client component; live `HH:MM` clock ticks every 15s; full date + sheet date from the device clock. On-call renders as a strip below the building header (mirrors the duty-roster export sheet's `OnCallStrip`).

## Decisions

- **The Lodge:** option (a) — keep 2 columns; empty column shows `—` (Lodge has no roster data yet).
- **Clock:** computed client-side (reception iPad set to NZ time).
- **Band mapping:** by `staff.role` substring; adjust `BANDS` in `today-board.ts` if real role values differ.

## Verify

- `scripts/db/verify-today-on-duty-rpc.mts` — anon can call the RPC + row shape.
- `scripts/db/verify-today-board-e2e.mts` — seed a shift dated today → anon RPC returns it.
- `scripts/db/verify-today-on-call-rpc.mts` — anon can call `today_on_call` + row shape.
- `scripts/db/verify-today-on-call-e2e.mts` — seed a `roster_on_call` row dated today → anon RPC returns it.

## Design spec / plan

- Spec: [today-roster-design.md](../../superpowers/specs/2026-07-20-today-roster-design.md)
- Plan: [today-roster-public-page.md](../../superpowers/plans/2026-07-20-today-roster-public-page.md)
