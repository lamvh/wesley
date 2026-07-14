-- Roles gain a usable within-group order. staff_roles.sort_order already exists
-- (0007) but every seeded role shares the default 0, so ordering is ambiguous.
-- Backfill a distinct sequence per group (by name) as a starting point; admins
-- then reorder roles within a group (e.g. Registered Nurse above Carer) from the
-- Roles & groups tab. The order sequences roles in each group's chip list and
-- staff within each roster band.

with ranked as (
  select building_id, name,
    row_number() over (
      partition by building_id, coalesce(group_id, '__none')
      order by name
    ) - 1 as rn
  from public.staff_roles
)
update public.staff_roles s
  set sort_order = r.rn
  from ranked r
  where s.building_id = r.building_id and s.name = r.name;
