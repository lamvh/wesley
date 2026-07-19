-- Per-day on-call assignment for the roster grid (A3): one row per (building,
-- date) naming the covering nurse/HCA. Mirrors roster_shifts' auto-save
-- pattern - upserted on every select change, deleted when cleared.
create table if not exists public.roster_on_call (
  id          uuid primary key default gen_random_uuid(),
  building_id text references public.buildings(id),
  on_call_date date not null,
  staff_id    uuid not null references public.staff(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (building_id, on_call_date)
);

create index if not exists roster_on_call_week_idx
  on public.roster_on_call (building_id, on_call_date);

alter table public.roster_on_call enable row level security;

do $$
begin
  drop policy if exists roster_on_call_read on public.roster_on_call;
  create policy roster_on_call_read on public.roster_on_call
    for select to authenticated using (true);
  drop policy if exists roster_on_call_write on public.roster_on_call;
  create policy roster_on_call_write on public.roster_on_call
    for all to authenticated using (true) with check (true);
end $$;
