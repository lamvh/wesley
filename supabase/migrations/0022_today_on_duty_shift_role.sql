-- Group the public "today on duty" board by the *shift's* role AND *shift's*
-- building, not the staff's role or the roster page's building. A staffer who
-- works a shift outside their own role (e.g. a nurse covering a kitchen shift),
-- or a shift whose template belongs to The Lodge, should appear under that
-- shift's role band and in that shift's building column — matching the roster
-- duty-export sheet, which buckets each shift by its template's role group and
-- splits Wesley | The Lodge by `shift_templates.building_id`. `roster_shifts`
-- rows carry the roster page's own building (always the page's building, e.g.
-- 'wesley'), so splitting by rs.building_id left The Lodge column empty. Falls
-- back to the staffer's role / the roster building when the shift has no
-- template / the template field is unset.
create or replace function public.today_on_duty()
returns table (building_id text, role text, staff_name text, shift_time text)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(st.building_id, rs.building_id) as building_id,
         coalesce(nullif(st.role, ''), s.role) as role,
         s.name as staff_name,
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
