-- A staff member whose roles span more than one role group can be pinned to a
-- chosen group for the weekly roster (which band they appear in). Null = auto:
-- the roster falls back to the earliest eligible group by sort order. Staff
-- whose roles all sit in one group never need this — it stays null for them.

alter table public.staff
  add column if not exists roster_group_id text;

-- Composite FK to the role group within the same building; clears to null if
-- that group is deleted so a staffer is never pinned to a stale group.
do $$
begin
  alter table public.staff
    add constraint staff_roster_group_fk
    foreign key (building_id, roster_group_id)
    references public.role_groups (building_id, id) on delete set null;
exception when duplicate_object then null;
end $$;
