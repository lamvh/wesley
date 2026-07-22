-- Optional "preferred name" per staffer (the name they like to be called, e.g.
-- "Bob" for "Robert Smith"). The roster grid, duty-export sheet and public
-- /today board show this in place of the legal name when set; the staff record,
-- sidebar identity and Users table keep the legal name. Avatar initials stay
-- derived from the legal name.
alter table public.staff add column if not exists preferred_name text;

-- Recreate today_on_duty as the final version: shift-role grouping + shift-
-- template building split (both prior) PLUS preferred-name display. staff_name
-- falls back to the legal name when preferred_name is empty/null.
create or replace function public.today_on_duty()
returns table (building_id text, role text, staff_name text, shift_time text)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(st.building_id, rs.building_id) as building_id,
         coalesce(nullif(st.role, ''), s.role) as role,
         coalesce(nullif(s.preferred_name, ''), s.name) as staff_name,
         coalesce(st.time_label, st.name) as shift_time
  from public.roster_shifts rs
  join public.staff s on s.id = rs.staff_id
  left join public.shift_templates st on st.id = rs.shift_id
  where rs.shift_date = (now() at time zone 'Pacific/Auckland')::date
  order by coalesce(st.building_id, rs.building_id),
           coalesce(nullif(st.role, ''), s.role),
           coalesce(st.time_label, st.name);
$$;

grant execute on function public.today_on_duty() to anon, authenticated;

-- On-call strip on /today: same preferred-name fallback for consistency with
-- the on-duty rows on the same board.
create or replace function public.today_on_call()
returns table (building_id text, staff_name text)
language sql
stable
security definer
set search_path = public
as $$
  select oc.building_id,
         coalesce(nullif(s.preferred_name, ''), s.name) as staff_name
  from public.roster_on_call oc
  join public.staff s on s.id = oc.staff_id
  where oc.on_call_date = (now() at time zone 'Pacific/Auckland')::date;
$$;

grant execute on function public.today_on_call() to anon, authenticated;
