-- Real room register for the Wesley site, plus the resident detail fields the
-- home actually records.
--
-- Rooms were mock-only until now (src/lib/mock-data/rooms.ts), so a resident's
-- room was validated against invented numbers. This creates the real register
-- from the 52 rooms Wesley has.
--
-- `wing` and `care_type` are left NULL deliberately: the room numbers were
-- supplied, the wing/care-type mapping was not, and inventing it would put wrong
-- clinical categories in front of staff. Fill them in once known - the columns
-- and the UI are ready for them.

create table if not exists public.rooms (
  building_id text not null references public.buildings(id),
  num         text not null,
  wing        text,                      -- Rātā|Kōwhai|Tōtara (see building_wings)
  care_type   text,                      -- Rest Home|Hospital|Dementia|Respite
  status      text not null default 'Available',  -- Occupied|Available|Maintenance|Respite
  note        text,
  -- Keeps "3A" after "3" and "125" after "34B"; a plain text sort would not.
  sort_order  int not null default 0,
  primary key (building_id, num)
);

alter table public.rooms enable row level security;

drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms
  for select to authenticated using (true);

drop policy if exists rooms_write on public.rooms;
create policy rooms_write on public.rooms
  for all to authenticated using (true) with check (true);

-- The 52 Wesley rooms, in the order given. Idempotent: re-running only
-- refreshes sort_order and never clears a wing/care_type/status set later.
insert into public.rooms (building_id, num, sort_order) values
  ('wesley', '1', 0),
  ('wesley', '2', 10),
  ('wesley', '3', 20),
  ('wesley', '3A', 30),
  ('wesley', '5', 40),
  ('wesley', '5A', 50),
  ('wesley', '6', 60),
  ('wesley', '7', 70),
  ('wesley', '8', 80),
  ('wesley', '9', 90),
  ('wesley', '10', 100),
  ('wesley', '11', 110),
  ('wesley', '12', 120),
  ('wesley', '13', 130),
  ('wesley', '17A', 140),
  ('wesley', '17B', 150),
  ('wesley', '18A', 160),
  ('wesley', '18B', 170),
  ('wesley', '19A', 180),
  ('wesley', '19B', 190),
  ('wesley', '20A', 200),
  ('wesley', '20B', 210),
  ('wesley', '21A', 220),
  ('wesley', '21B', 230),
  ('wesley', '22A', 240),
  ('wesley', '22B', 250),
  ('wesley', '25', 260),
  ('wesley', '26', 270),
  ('wesley', '27', 280),
  ('wesley', '28', 290),
  ('wesley', '29A', 300),
  ('wesley', '29B', 310),
  ('wesley', '30A', 320),
  ('wesley', '30B', 330),
  ('wesley', '31A', 340),
  ('wesley', '31B', 350),
  ('wesley', '32A', 360),
  ('wesley', '32B', 370),
  ('wesley', '33A', 380),
  ('wesley', '33B', 390),
  ('wesley', '34A', 400),
  ('wesley', '34B', 410),
  ('wesley', '125', 420),
  ('wesley', '126', 430),
  ('wesley', '127', 440),
  ('wesley', '128', 450),
  ('wesley', '129', 460),
  ('wesley', '130', 470),
  ('wesley', '131', 480),
  ('wesley', '132', 490),
  ('wesley', '133', 500),
  ('wesley', '134', 510)
on conflict (building_id, num) do update set sort_order = excluded.sort_order;

-- ── Resident details the home records ──────────────────────────────────
-- "Location in facility" is the existing `room` column, now backed by the real
-- register above rather than mock numbers.
alter table public.residents add column if not exists dob            date;
alter table public.residents add column if not exists admitted_on    date;
alter table public.residents add column if not exists nhi            text;
alter table public.residents add column if not exists gender         text;
alter table public.residents add column if not exists resident_group text;
alter table public.residents add column if not exists phone          text;

-- NHI is the NZ National Health Index number: 3 letters + 4 digits (older
-- format ends in a digit, the newer one in a letter). Stored uppercase and
-- unique per building so the same person can't be admitted twice by mistake.
create unique index if not exists residents_nhi_unique
  on public.residents (building_id, upper(nhi)) where nhi is not null and nhi <> '';

select count(*) as wesley_rooms from public.rooms where building_id = 'wesley';
