# Roster & shifts

- **Route:** `/portal/roster` — `app/portal/roster/page.tsx`
- **Section:** Portal · **Access:** both
- **Source:** lines `752–798` (markup); data `1168–1192`
- **Render:** RSC (+ client islands: `week-view` toggle pill, inert Approve/Decline buttons if wired as client noop)

## Purpose
Daily staffing board for the home: who is on each of the three shifts, where the coverage gap is, and the pending leave/swap requests awaiting an approval decision. Used by admin (roster owner) and staff (checking own cover).

## Layout
Centered column (`max-width:1180px`). Top-to-bottom:
1. Header row — title + coverage subline on the left, `Week view` + `+ Assign shift` buttons on the right (`flex`, wraps).
2. Three-column shift grid (`grid-template-columns:repeat(3,1fr)`, gap `16px`, `margin-top:22px`).
3. Full-width "Leave & requests" card below the grid (`margin-top:16px`).

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header (title, date + coverage line, action buttons) | `roster-header` | Title `Roster & shifts` (Newsreader 32px); subline `Saturday, 11 July · {rosterCoverage}`; `Week view` = secondary button, `+ Assign shift` = accent primary button |
| Shift columns (3) | `shift-column` | One per shift. Card = cream-2 + border, radius `16px`. Tinted head (`sh.headBg`) with shift `name` + `time` + status pill (`status`/`statColor`/`statTint`). Body lists staff rows. |
| Staff row (within column) | `staff-row` | 38px round avatar (initials on `p.color`), name, `role · wing` meta. Hover background `cream`. |
| Open-shift gap card (Night only) | `open-shift-card` | Dashed terracotta border (`1px dashed`), `+` glyph tile, "Open shift" + `sh.gap` text. Renders only when `sh.gap` truthy. |
| Leave & requests list | `leave-request-list` + `leave-request-row` | Card title `Leave & requests` (Newsreader 20px). Each row: 34px avatar, `name · type`, `dates` meta, Approve (sage) + Decline (outline) buttons. |

Grid columns: shifts `repeat(3,1fr)`. Coverage/gap driven by data, not layout.

## Data consumed
From `lib/mock-data/staff-shifts.ts` (see 03-data-model.md):
- `getShifts()` → `Shift[]`. Fields used per shift: `name` (`Morning`|`Afternoon`|`Night`), `time`, `status` (`Full` / `1 open`), `staff[]`, `gap` (string | null). Presentation `headBg`, `statColor`, `statTint` derived in accessor/helper from `status` (shift-status semantic scale), not stored raw.
  - Per `staff` member (`StaffMember`): `name`, `role` (`RN`|`Carer`|`Activities`), `wing`, `initials`, `colorKey` (avatar palette).
- `rosterCoverage` string (`"10 of 11 shifts covered · 1 open"`) — header subline, exposed via `getShifts()` result or a `getRosterCoverage()` accessor.
- `getLeaveRequests()` → `LeaveRequest[]`: `name`, `type` (`Annual leave`/`Shift swap`/`Sick leave`), `dates`, `initials`, `colorKey`.

## Variants & states
- **Role:** identical layout for admin and staff this phase (route access `both`); no role-gated content.
- **Shift status:** Full → sage pill (`#3F5137`/`#E5EBDD`); open → gold/rust pill (`1 open` → `#93502F`/`#F1E0D3`). Head tint differs per shift (`headBg`).
- **Open-shift card:** present only on shifts with a `gap` (Night here); dashed-border "gap" treatment signals unfilled slot, paired with text (colour never sole signal).
- **Staff row hover:** background lifts to `cream`.
- **Empty state:** if a shift had no staff the column body renders only the gap card / nothing — not exercised by mock data (all shifts staffed).

## Interactions
- `Week view` button — toggles a week/day view pill (visual only this phase; no alternate view built). Client island if wired.
- `+ Assign shift` — inert (would open an assign flow). No-op.
- `Approve` / `Decline` per leave request — inert stubs (would mutate request status). No-op / `console` noop.
- No row navigates to a detail route (roster has no nested detail this phase).

## Tokens
- **Shift/room status semantic scale** (01-design-system.md): Full/Occupied → sage `#3F5137`/`#E5EBDD`; Open/Respite → gold `#8A6516`/`#F3E8CE`; the Night "1 open" pill uses rust `#93502F`/`#F1E0D3` (maintenance/alert tone). Head tints (`#EEF2E7`, `#F3EDE1`, `#F5EBE2`) are per-shift wash tones.
- Avatar palette for `colorKey` (initials backgrounds).
- Buttons: secondary (cream field + `field` border) and accent primary (`accent` var). Approve = sage tint button; Decline = ghost outline.
- Radius: cards `16px`, buttons/pills `9–11px` / `100px`. Fonts: Newsreader (title, card headings), Instrument Sans (body/UI).

## Out of scope (this phase)
Present visually but inert: `Week view` toggle (no alternate view), `+ Assign shift`, per-request `Approve` and `Decline`. No real roster mutation, no persistence, no week navigation.

## Definition of Done
- Three shift columns render Morning / Afternoon / Night with correct staff rows and status pills from `getShifts()`.
- Night column shows the dashed open-shift gap card; Morning/Afternoon do not.
- Header coverage subline reads from `rosterCoverage`.
- Leave & requests list renders all requests with Approve/Decline buttons (inert, noted).
- No raw hex in JSX; status colours via the shift-status scale helper. Global DoD (00-rules §11) met.
