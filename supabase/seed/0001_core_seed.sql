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
-- for now (self-registration is impossible - accounts are invite-only). Tighten
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


-- ═══════════════════════ SEED DATA ═══════════════════════

-- role_permissions (6 roles × 10 modules × 4 actions)
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','dashboard','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','dashboard','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','dashboard','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','dashboard','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','residents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','residents','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','residents','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','residents','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','rooms','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','rooms','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','rooms','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','rooms','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','roster','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','roster','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','roster','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','roster','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','meals','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','meals','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','meals','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','meals','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','activities','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','activities','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','activities','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','activities','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','family','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','family','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','family','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','family','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','stock','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','stock','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','stock','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','stock','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','incidents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','incidents','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','incidents','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','incidents','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','users','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','users','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','users','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('super_admin','users','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','dashboard','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','dashboard','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','dashboard','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','dashboard','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','residents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','residents','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','residents','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','residents','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','rooms','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','rooms','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','rooms','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','rooms','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','roster','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','roster','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','roster','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','roster','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','meals','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','meals','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','meals','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','meals','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','activities','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','activities','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','activities','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','activities','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','family','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','family','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','family','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','family','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','stock','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','stock','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','stock','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','stock','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','incidents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','incidents','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','incidents','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','incidents','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','users','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','users','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','users','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('admin','users','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','dashboard','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','dashboard','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','dashboard','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','dashboard','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','residents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','residents','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','residents','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','residents','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','rooms','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','rooms','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','rooms','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','rooms','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','roster','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','roster','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','roster','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','roster','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','meals','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','meals','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','meals','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','meals','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','activities','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','activities','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','activities','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','activities','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','family','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','family','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','family','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','family','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','stock','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','stock','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','stock','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','stock','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','incidents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','incidents','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','incidents','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','incidents','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','users','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','users','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','users','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('nurse','users','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','dashboard','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','dashboard','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','dashboard','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','dashboard','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','residents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','residents','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','residents','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','residents','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','rooms','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','rooms','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','rooms','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','rooms','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','roster','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','roster','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','roster','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','roster','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','meals','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','meals','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','meals','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','meals','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','activities','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','activities','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','activities','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','activities','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','family','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','family','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','family','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','family','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','stock','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','stock','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','stock','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','stock','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','incidents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','incidents','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','incidents','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','incidents','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','users','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','users','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','users','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('carer','users','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','dashboard','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','dashboard','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','dashboard','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','dashboard','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','residents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','residents','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','residents','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','residents','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','rooms','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','rooms','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','rooms','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','rooms','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','roster','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','roster','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','roster','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','roster','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','meals','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','meals','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','meals','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','meals','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','activities','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','activities','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','activities','edit',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','activities','delete',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','family','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','family','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','family','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','family','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','stock','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','stock','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','stock','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','stock','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','incidents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','incidents','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','incidents','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','incidents','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','users','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','users','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','users','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('activities','users','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','dashboard','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','dashboard','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','dashboard','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','dashboard','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','residents','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','residents','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','residents','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','residents','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','rooms','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','rooms','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','rooms','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','rooms','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','roster','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','roster','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','roster','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','roster','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','meals','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','meals','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','meals','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','meals','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','activities','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','activities','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','activities','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','activities','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','family','view',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','family','create',true) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','family','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','family','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','stock','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','stock','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','stock','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','stock','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','incidents','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','incidents','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','incidents','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','incidents','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','users','view',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','users','create',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','users','edit',false) on conflict (role_id, module, action) do update set granted = excluded.granted;
insert into public.role_permissions (role_id, module, action, granted) values ('family','users','delete',false) on conflict (role_id, module, action) do update set granted = excluded.granted;

-- buildings + wings
insert into public.buildings (id, name, full_name, suburb, manager_name, color, tint) values ('wesley','Wesley','Victoria at Mt Eden','Mt Eden, Auckland','Sarah Beckett','#2C3563','#E4E6F2') on conflict (id) do update set name=excluded.name, full_name=excluded.full_name, suburb=excluded.suburb, manager_name=excluded.manager_name, color=excluded.color, tint=excluded.tint;
insert into public.building_wings (building_id, name) values ('wesley','Kōwhai') on conflict (building_id, name) do nothing;
insert into public.building_wings (building_id, name) values ('wesley','Rātā') on conflict (building_id, name) do nothing;
insert into public.building_wings (building_id, name) values ('wesley','Tōtara') on conflict (building_id, name) do nothing;
insert into public.buildings (id, name, full_name, suburb, manager_name, color, tint) values ('lodge','The Lodge','The Lodge at Epsom','Epsom, Auckland','Michael Tanner','#3d6b74','#DEEAEC') on conflict (id) do update set name=excluded.name, full_name=excluded.full_name, suburb=excluded.suburb, manager_name=excluded.manager_name, color=excluded.color, tint=excluded.tint;
insert into public.building_wings (building_id, name) values ('lodge','Willow') on conflict (building_id, name) do nothing;
insert into public.building_wings (building_id, name) values ('lodge','Manuka') on conflict (building_id, name) do nothing;

-- app_users (role assignment)
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('Sarah Beckett','sarah.beckett@wesley.nz','admin','wesley','All wings','Active') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('IT Administrator','it@wesley.nz','super_admin','wesley','System','Active') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('Aroha Ngata','aroha.ngata@wesley.nz','nurse','wesley','Rātā wing','Active') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('David Cho','david.cho@wesley.nz','nurse','wesley','Kōwhai wing','Active') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('Mere Solomon','mere.solomon@wesley.nz','carer','wesley','Rātā wing','Active') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('Tomasi Fifita','tomasi.fifita@wesley.nz','carer','wesley','Kōwhai wing','Active') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('Grace Lin','grace.lin@wesley.nz','activities','wesley','All wings','Active') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('Priya Nair','priya.nair@wesley.nz','carer','wesley','Kōwhai wing','Invited') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('David Whitcombe','d.whitcombe@gmail.com','family','wesley','Peggy W. · Rātā 12','Active') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;
insert into public.app_users (name, email, role_id, building_id, scope, status) values ('Katherine Ruatoto','k.ruatoto@gmail.com','family','wesley','Joan F. · Rātā 15','Suspended') on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;

-- project owner (super_admin)
insert into public.app_users (auth_id, name, email, role_id, building_id, scope, status) values ((select id from auth.users where email = 'vhlam1997@gmail.com'), 'lamvh', 'vhlam1997@gmail.com', 'super_admin', null, 'System', 'Active') on conflict (email) do update set name=excluded.name, role_id='super_admin', status='Active', auth_id=coalesce(app_users.auth_id, excluded.auth_id);

-- staff
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','Aroha Ngata','RN','Rātā','AN','#6E875E' where not exists (select 1 from public.staff where name='Aroha Ngata' and building_id='wesley');
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','Mere Solomon','Carer','Rātā','MS','#b06a5a' where not exists (select 1 from public.staff where name='Mere Solomon' and building_id='wesley');
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','Tomasi Fifita','Carer','Kōwhai','TF','#5b8f9a' where not exists (select 1 from public.staff where name='Tomasi Fifita' and building_id='wesley');
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','Grace Lin','Activities','All','GL','#c08a3e' where not exists (select 1 from public.staff where name='Grace Lin' and building_id='wesley');
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','David Cho','RN','Kōwhai','DC','#8a6ba3' where not exists (select 1 from public.staff where name='David Cho' and building_id='wesley');
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','Ana Reti','Carer','Rātā','AR','#6e879e' where not exists (select 1 from public.staff where name='Ana Reti' and building_id='wesley');
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','Sione Latu','Carer','Tōtara','SL','#9a7b4f' where not exists (select 1 from public.staff where name='Sione Latu' and building_id='wesley');
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','Priya Nair','Carer','Kōwhai','PN','#7e9b6a' where not exists (select 1 from public.staff where name='Priya Nair' and building_id='wesley');
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','Rachel Boyd','RN','All','RB','#6E875E' where not exists (select 1 from public.staff where name='Rachel Boyd' and building_id='wesley');
insert into public.staff (building_id, name, role, wing, initials, color) select 'wesley','James Whaanga','Carer','Rātā','JW','#b06a5a' where not exists (select 1 from public.staff where name='James Whaanga' and building_id='wesley');

-- residents
insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values ('wesley','margaret-whitcombe','Margaret Whitcombe','Peggy','12','Rātā','Rest Home',84,'Soft, no nuts','Walking frame','Dr Anaru','MW','#6E875E','A retired botany teacher who loves the garden and never misses her morning crossword. Family visit Sundays.',array['Falls watch','Diabetic','Hearing aid']::text[]) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;
insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values ('wesley','henry-fitzgerald','Henry Fitzgerald','Harry','07','Rātā','Rest Home',88,'Diabetic','Independent','Dr Patel','HF','#BE7350','Former merchant sailor with wonderful stories. Enjoys the men’s shed group and a strong cup of tea.',array['Diabetic','Falls watch']::text[]) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;
insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values ('wesley','dorothy-nguyen','Dorothy Nguyen','Dot','21','Kōwhai','Hospital',91,'Puree, thickened','Hoist transfer','Dr Anaru','DN','#8a6ba3','Gentle and quietly funny. Loves being read to and listening to 1950s jazz in the afternoons.',array['Thickened fluids','Hoist transfer']::text[]) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;
insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values ('wesley','william-toop','William Toop','Bill','18','Kōwhai','Hospital',86,'Normal','Wheelchair','Dr Patel','WT','#5b8f9a','A keen follower of the cricket. Prefers a window seat and the company of the resident cat, Miso.',array['Wheelchair']::text[]) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;
insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values ('wesley','ngaire-thompson','Ngaire Thompson','Ngaire','30','Tōtara','Dementia',79,'Finger foods','Independent','Dr Anaru','NT','#c08a3e','Settles best with music and movement. Responds warmly to waiata and gentle routine.',array['Dementia care','Finger foods']::text[]) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;
insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values ('wesley','robert-mckenzie','Robert McKenzie','Bob','33','Tōtara','Dementia',82,'Soft','Walking frame','Dr Patel','RM','#9a7b4f','A retired builder who likes to keep busy. Enjoys tactile activities and afternoon walks in the courtyard.',array['Dementia care','Falls watch']::text[]) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;
insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values ('wesley','patricia-vaughan','Patricia Vaughan','Pat','05','Rātā','Rest Home',80,'Vegetarian','Independent','Dr Anaru','PV','#7e9b6a','Still knits for the local plunket. Runs the Thursday craft circle with great enthusiasm.',array['Vegetarian','Independent']::text[]) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;
insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values ('wesley','george-aleki','George Aleki','George','24','Kōwhai','Respite',77,'Normal','Walking stick','Dr Patel','GA','#b06a5a','A warm, sociable man who has settled in wonderfully. Loves the choir and a game of cards.',array['Respite stay','Walking stick']::text[]) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;
insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values ('wesley','joan-ferris','Joan Ferris','Joan','15','Rātā','Rest Home',85,'Gluten free','Walking frame','Dr Anaru','JF','#6e879e','A former church organist. Delights in the Sunday service and singalongs at the piano.',array['Gluten free','Falls watch']::text[]) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;
