-- Staff can hold multiple job roles. `roles` is the full list; the existing
-- NOT NULL `role` column is kept as the primary role (roles[1]) for legacy
-- readers. Backfill existing rows from their single role.
alter table public.staff
  add column if not exists roles text[];

update public.staff
  set roles = array[role]
  where roles is null and role is not null;
