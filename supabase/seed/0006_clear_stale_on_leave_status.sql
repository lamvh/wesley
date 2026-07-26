-- Whether someone is on leave is derived from approved leave_requests covering
-- today (see lib/data/staff.ts::getStaff), not stored on the staff row. One
-- seeded record - Candy Tian - still carried status = 'On leave' with no leave
-- request behind it, so she showed as away permanently.
--
-- Clear any such row so the badge only ever reflects real leave data.
-- Idempotent: re-running touches nothing once they are all 'Active'.

update public.staff
   set status = 'Active'
 where status = 'On leave';

select name, status from public.staff order by name;
