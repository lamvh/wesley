-- Backfill distinct colors for staff_roles rows still on the column default.
-- Migration 0007 bulk-seeded the base role registry without setting
-- color/tint (unlike saveRole(), which auto-assigns from a curated palette
-- for roles created later via the UI), so every seeded role shares the same
-- default color/tint. That made role-derived shift chips on the roster grid
-- render as a single color instead of one per role. Idempotent: only rows
-- still on the default get reassigned, using the same palette saveRole()
-- draws from (lib/actions/roles.ts PALETTE) so old and new roles look
-- consistent.
with palette(color, tint, idx) as (
  values
    ('#2C5A6E', '#D8EAF0', 0),
    ('#6E875E', '#E5EBDD', 1),
    ('#8a4b6b', '#F2DEE8', 2),
    ('#c08a3e', '#EDE6D3', 3),
    ('#3d6b74', '#E1EAEC', 4),
    ('#93502F', '#F1E0D3', 5),
    ('#2C3563', '#E4E6F2', 6),
    ('#6b5a2c', '#F0E7CE', 7)
),
ranked as (
  select building_id, name,
         (row_number() over (partition by building_id order by name) - 1) % 8 as idx
  from public.staff_roles
  where color = '#5B5347' and tint = '#EFE7D7'
)
update public.staff_roles r
set color = p.color, tint = p.tint
from ranked k
join palette p on p.idx = k.idx
where r.building_id = k.building_id and r.name = k.name;
