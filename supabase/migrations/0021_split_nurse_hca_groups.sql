-- Split the roster band "Nurses & HCAs" into two separate bands, Nurse and
-- HCA, so the two role types display as distinct groups on the roster grid
-- and Roles & groups tab instead of one merged band.
--
-- Registered Nurse -> Nurse. Carer -> HCA. Team Leader is intentionally left
-- unassigned (not merged into either band) per an explicit call - it drops to
-- the trailing "Unassigned" band on the roster like any other ungrouped role.
insert into public.role_groups (id, building_id, label, color, tint, sort_order) values
  ('nurses', 'wesley', 'Nurse', '#2C3563', '#E4E6F2', 0),
  ('hcas',   'wesley', 'HCA',   '#2C5A6E', '#D8EAF0', 1)
on conflict (building_id, id) do nothing;

update public.role_groups set sort_order = 2 where building_id = 'wesley' and id = 'care_takers';
update public.role_groups set sort_order = 3 where building_id = 'wesley' and id = 'kitchen';

update public.staff_roles set group_id = 'nurses' where building_id = 'wesley' and name = 'Registered Nurse';
update public.staff_roles set group_id = 'hcas'   where building_id = 'wesley' and name = 'Carer';

-- Every other role still pointing at the old group (Team Leader, plus any
-- custom role someone added to it, e.g. a typo'd "Activity Cordinator") drops
-- to Unassigned. staff_roles.group_id's FK to role_groups is a COMPOSITE key
-- (building_id, group_id) -> (building_id, id); ON DELETE SET NULL on a
-- composite FK nulls *every* column in the key, including building_id (which
-- is NOT NULL) - so any row still referencing 'nurses_hcas' at delete time
-- would violate the not-null constraint instead of being cleanly unassigned.
-- Clearing group_id here first avoids ever triggering that cascade.
update public.staff_roles set group_id = null
  where building_id = 'wesley' and group_id = 'nurses_hcas';

delete from public.role_groups where building_id = 'wesley' and id = 'nurses_hcas';
