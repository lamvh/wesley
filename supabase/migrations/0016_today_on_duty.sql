-- Public "today on duty" board data. roster_shifts/staff/shift_templates are RLS
-- and closed to anon; this SECURITY DEFINER function is the only anon-visible
-- surface and returns just what the reception iPad shows: name, role band, shift
-- time, building — for today (Auckland local date) only. No contact/pay data.
create or replace function public.today_on_duty()
returns table (building_id text, role text, staff_name text, shift_time text)
language sql
stable
security definer
set search_path = public
as $$
  select rs.building_id,
         s.role,
         s.name as staff_name,
         coalesce(st.time_label, st.name) as shift_time
  from public.roster_shifts rs
  join public.staff s on s.id = rs.staff_id
  left join public.shift_templates st on st.id = rs.shift_id
  where rs.shift_date = (now() at time zone 'Pacific/Auckland')::date
  order by rs.building_id, s.role, coalesce(st.time_label, st.name);
$$;

grant execute on function public.today_on_duty() to anon, authenticated;
