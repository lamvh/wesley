-- Public "who's on call today" for the /today board. roster_on_call/staff are
-- RLS and closed to anon; this SECURITY DEFINER function is the only
-- anon-visible surface and returns just a name per building for today
-- (Auckland local date). No contact/pay data.
create or replace function public.today_on_call()
returns table (building_id text, staff_name text)
language sql
stable
security definer
set search_path = public
as $$
  select oc.building_id,
         s.name as staff_name
  from public.roster_on_call oc
  join public.staff s on s.id = oc.staff_id
  where oc.on_call_date = (now() at time zone 'Pacific/Auckland')::date;
$$;

grant execute on function public.today_on_call() to anon, authenticated;
