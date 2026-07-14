-- Roles registry + role groups. Roles become first-class, admin-managed entities
-- (created/deleted in Staff → Roles & groups) instead of free strings assembled
-- from the staff list. Groups band and order the weekly roster: staff are sorted
-- into the group their role belongs to, in group sort_order (a multi-role staff
-- lands in the earliest group any of their roles maps to). `staff_roles.name`
-- matches the strings held in staff.roles so no staff rows need rewriting.

create table if not exists public.role_groups (
  id          text not null,
  building_id text not null references public.buildings(id),
  label       text not null,
  color       text not null default '#2C3563',
  tint        text not null default '#E4E6F2',
  sort_order  int  not null default 0,
  primary key (building_id, id)
);

create table if not exists public.staff_roles (
  building_id text not null references public.buildings(id),
  name        text not null,               -- role label, matches staff.roles entries
  color       text not null default '#5B5347',
  tint        text not null default '#EFE7D7',
  group_id    text,                         -- null = unassigned; FK enforced below
  sort_order  int  not null default 0,
  primary key (building_id, name),
  foreign key (building_id, group_id)
    references public.role_groups (building_id, id) on delete set null
);

create index if not exists staff_roles_group_idx
  on public.staff_roles (building_id, group_id);

alter table public.role_groups enable row level security;
alter table public.staff_roles enable row level security;

do $$
begin
  drop policy if exists role_groups_read on public.role_groups;
  create policy role_groups_read on public.role_groups
    for select to authenticated using (true);
  drop policy if exists role_groups_write on public.role_groups;
  create policy role_groups_write on public.role_groups
    for all to authenticated using (true) with check (true);

  drop policy if exists staff_roles_read on public.staff_roles;
  create policy staff_roles_read on public.staff_roles
    for select to authenticated using (true);
  drop policy if exists staff_roles_write on public.staff_roles;
  create policy staff_roles_write on public.staff_roles
    for all to authenticated using (true) with check (true);
end $$;

-- ---- seed groups (ordered) ----
insert into public.role_groups (id, building_id, label, color, tint, sort_order) values
  ('nurses_hcas', 'wesley', 'Nurses & HCAs', '#2C3563', '#E4E6F2', 0),
  ('care_takers', 'wesley', 'Care Takers',   '#3F5137', '#E5EBDD', 1),
  ('kitchen',     'wesley', 'Kitchen',       '#8A6516', '#F3E8CE', 2)
on conflict (building_id, id) do nothing;

-- ---- seed the role registry from every role already held by staff ----
-- so no existing staffer loses their role, plus the standard base roles.
insert into public.staff_roles (building_id, name)
  select 'wesley', r
  from (
    select distinct unnest(roles) as r from public.staff where building_id = 'wesley'
    union
    select unnest(array['Carer', 'Registered Nurse', 'Team Leader', 'Activities', 'Care Taker', 'Kitchen'])
  ) src
  where r is not null and r <> ''
on conflict (building_id, name) do nothing;

-- ---- default role → group mapping (admin can reassign later) ----
update public.staff_roles set group_id = 'nurses_hcas'
  where building_id = 'wesley' and name in ('Registered Nurse', 'Carer', 'Team Leader');
update public.staff_roles set group_id = 'care_takers'
  where building_id = 'wesley' and name in ('Care Taker');
update public.staff_roles set group_id = 'kitchen'
  where building_id = 'wesley' and name in ('Kitchen');
