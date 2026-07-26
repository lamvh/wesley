-- Drop the wing / care-type concept; keep room tier as its own stored field.
--
-- Wings (Rātā / Kōwhai / Tōtara) and care types (Rest Home / Hospital /
-- Dementia / Respite) were design-source inventions that the real data never
-- carried: the 52 rooms Wesley supplied in 0027 came with neither. Keeping
-- columns nobody fills means the UI shows blanks and, worse, invites someone to
-- guess a clinical category.
--
-- Room tier (Normal / Premium / VIP) survives, but as its OWN column rather than
-- something derived from the wing name - which is what made it disappear along
-- with wings. It starts NULL for every room; the tier per room is real data only
-- the home can supply.

alter table public.rooms add column if not exists tier text;  -- Normal|Premium|VIP

alter table public.rooms      drop column if exists wing;
alter table public.rooms      drop column if exists care_type;
alter table public.residents  drop column if exists wing;
alter table public.residents  drop column if exists care_type;
-- staff.wing recorded which wing someone was rostered to; the roster bands by
-- role group instead and nothing has read this column for some time.
alter table public.staff      drop column if exists wing;

-- The wing register itself has no remaining readers.
drop table if exists public.building_wings;

select
  (select count(*) from public.rooms where building_id = 'wesley') as wesley_rooms,
  (select count(*) from public.rooms where tier is not null)       as rooms_with_tier;
