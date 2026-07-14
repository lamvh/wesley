-- Weekly roster persistence: one row per (staff member, calendar date, shift
-- type) assignment. Rows are written/removed as shifts are toggled in the roster
-- grid (auto-save); a week's grid is rebuilt by selecting rows whose shift_date
-- falls within that Mon–Sun range.

create table if not exists public.roster_shifts (
  id          uuid primary key default gen_random_uuid(),
  building_id text references public.buildings(id),
  staff_id    uuid not null references public.staff(id) on delete cascade,
  shift_date  date not null,
  shift_id    text not null,               -- shift-type id (m, d, n, ...) from the shift vocabulary
  created_at  timestamptz not null default now(),
  unique (staff_id, shift_date, shift_id)
);

create index if not exists roster_shifts_week_idx
  on public.roster_shifts (building_id, shift_date);

alter table public.roster_shifts enable row level security;

do $$
begin
  drop policy if exists roster_shifts_read on public.roster_shifts;
  create policy roster_shifts_read on public.roster_shifts
    for select to authenticated using (true);
  drop policy if exists roster_shifts_write on public.roster_shifts;
  create policy roster_shifts_write on public.roster_shifts
    for all to authenticated using (true) with check (true);
end $$;
