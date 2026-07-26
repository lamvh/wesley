-- Sick leave gets its own entitlement and its own consumed counter.
--
-- Until now `staff` carried a single `annual` entitlement and a single `taken`
-- counter, and approve_leave debited `taken` for BOTH 'Annual leave' and
-- 'Sick leave'. That made the Leave-left figure wrong the moment anyone took
-- sick leave: it was charged against the annual allowance.
--
-- Existing `taken` values are left alone and keep meaning annual days taken -
-- there are no approved leave requests on record to re-attribute, so nothing
-- can be split retroactively.

alter table public.staff add column if not exists sick       int not null default 0;
alter table public.staff add column if not exists sick_taken int not null default 0;

-- Entitlements are now entered per staff member; anyone not given a number has
-- none, rather than silently inheriting a 20-day allowance.
alter table public.staff alter column annual set default 0;
alter table public.staff alter column taken  set default 0;

-- Approving a request now debits the counter that matches its type. Shift swaps
-- still consume nothing. Unchanged otherwise: it is a no-op when the request is
-- missing or already approved, so double-clicking Approve cannot double-charge.
create or replace function public.approve_leave(p_id uuid)
returns void language plpgsql security invoker as $$
declare v public.leave_requests;
begin
  select * into v from public.leave_requests where id = p_id for update;
  if not found or v.status = 'Approved' then return; end if;
  update public.leave_requests set status = 'Approved' where id = p_id;
  if v.type = 'Annual leave' then
    update public.staff set taken = coalesce(taken,0) + coalesce(v.days,0)
      where id = v.staff_id;
  elsif v.type = 'Sick leave' then
    update public.staff set sick_taken = coalesce(sick_taken,0) + coalesce(v.days,0)
      where id = v.staff_id;
  end if;
end $$;

grant execute on function public.approve_leave(uuid) to authenticated;
