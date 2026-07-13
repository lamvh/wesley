-- Core schema for real staff/resident management + role-based access.
-- Mirrors src/types/domain.ts + docs/03-data-model.md. Idempotent so it can be
-- re-run safely. RLS is on for every table (secure by default).

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ─────────────────────────── RBAC ───────────────────────────
create table if not exists public.roles (
  id          text primary key,          -- super_admin|admin|nurse|carer|activities|family
  label       text not null,
  description text,
  is_system   boolean not null default false
);

-- Editable grant matrix (module × action). super_admin is seeded allow-all too
-- so the source of truth lives in one place.
create table if not exists public.role_permissions (
  role_id text not null references public.roles(id) on delete cascade,
  module  text not null,                 -- dashboard|residents|rooms|roster|meals|activities|family|stock|incidents|users
  action  text not null,                 -- view|create|edit|delete
  granted boolean not null default false,
  primary key (role_id, module, action)
);

-- ───────────────────────── Buildings ────────────────────────
create table if not exists public.buildings (
  id           text primary key,         -- wesley|lodge
  name         text not null,
  full_name    text,
  suburb       text,
  manager_name text,
  color        text,
  tint         text,
  created_at   timestamptz not null default now()
);

create table if not exists public.building_wings (
  building_id text not null references public.buildings(id) on delete cascade,
  name        text not null,
  primary key (building_id, name)
);

-- ──────────────── App users (auth + role link) ──────────────
create table if not exists public.app_users (
  id             uuid primary key default gen_random_uuid(),
  auth_id        uuid unique references auth.users(id) on delete set null,
  name           text not null,
  email          citext unique not null,
  role_id        text not null references public.roles(id),
  building_id    text references public.buildings(id),
  scope          text,                    -- free-text scope for now (wing / resident)
  status         text not null default 'Invited'
                 check (status in ('Active', 'Invited', 'Suspended')),
  last_active_at timestamptz,
  created_at     timestamptz not null default now()
);

-- ─────────────────────── Staff (care team) ──────────────────
create table if not exists public.staff (
  id          uuid primary key default gen_random_uuid(),
  building_id text references public.buildings(id),
  user_id     uuid references public.app_users(id) on delete set null,
  name        text not null,
  role        text not null,              -- RN|Carer|Activities
  wing        text,                       -- Rātā|Kōwhai|Tōtara|All
  initials    text,
  color       text,
  status      text not null default 'Active',
  created_at  timestamptz not null default now()
);

-- ───────────────────────── Residents ────────────────────────
create table if not exists public.residents (
  id          uuid primary key default gen_random_uuid(),
  building_id text references public.buildings(id),
  slug        text not null,
  name        text not null,
  pref        text,
  room        text,
  wing        text,                       -- Rātā|Kōwhai|Tōtara
  care_type   text,                       -- Rest Home|Hospital|Dementia|Respite
  age         int,
  diet        text,
  mobility    text,
  gp          text,
  avatar      text,                       -- initials
  color       text,
  note        text,
  flags       text[] not null default '{}',
  created_at  timestamptz not null default now(),
  unique (building_id, slug)
);

-- Fixed role lookup.
insert into public.roles (id, label, description, is_system) values
  ('super_admin', 'Super Admin',       'Full system access',         true),
  ('admin',       'Administrator',      'Facility management',        false),
  ('nurse',       'Registered Nurse',   'Clinical care',              false),
  ('carer',       'Carer',              'Daily resident care',        false),
  ('activities',  'Activities',         'Activities & wellbeing',     false),
  ('family',      'Family',             'Whānau portal access',       false)
on conflict (id) do nothing;

-- ─────────────────────────── RLS ────────────────────────────
-- Every table is RLS-protected. Reference + directory data is readable by any
-- signed-in user; writes to operational data are allowed to signed-in users
-- for now (self-registration is impossible — accounts are invite-only). Tighten
-- to per-role policies once the role claim is on the JWT.
alter table public.roles            enable row level security;
alter table public.role_permissions enable row level security;
alter table public.buildings        enable row level security;
alter table public.building_wings   enable row level security;
alter table public.app_users        enable row level security;
alter table public.staff            enable row level security;
alter table public.residents        enable row level security;

-- Read-only reference tables (writes go through service-role only).
drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles
  for select to authenticated using (true);

drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions
  for select to authenticated using (true);

drop policy if exists buildings_read on public.buildings;
create policy buildings_read on public.buildings
  for select to authenticated using (true);

drop policy if exists building_wings_read on public.building_wings;
create policy building_wings_read on public.building_wings
  for select to authenticated using (true);

-- A signed-in user can always read their own account row (drives access gating).
drop policy if exists app_users_read on public.app_users;
create policy app_users_read on public.app_users
  for select to authenticated using (true);

drop policy if exists app_users_write on public.app_users;
create policy app_users_write on public.app_users
  for all to authenticated using (true) with check (true);

-- Operational data: readable + writable by signed-in staff.
drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff
  for select to authenticated using (true);

drop policy if exists staff_write on public.staff;
create policy staff_write on public.staff
  for all to authenticated using (true) with check (true);

drop policy if exists residents_read on public.residents;
create policy residents_read on public.residents
  for select to authenticated using (true);

drop policy if exists residents_write on public.residents;
create policy residents_write on public.residents
  for all to authenticated using (true) with check (true);
