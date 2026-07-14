-- Staff admin: extend staff with employment + leave-balance fields; add shift
-- templates and leave requests. Approving Annual/Sick leave debits staff.taken.

alter table public.staff
  add column if not exists contract   text,
  add column if not exists hours       int,
  add column if not exists phone       text,
  add column if not exists start_label text,
  add column if not exists annual      int not null default 20,
  add column if not exists taken       int not null default 0;

create table if not exists public.shift_templates (
  id          text primary key,
  building_id text references public.buildings(id),
  name        text not null,
  time_label  text,
  req         int not null default 1,
  filled      int not null default 0,
  color       text, tint text, border text,
  created_at  timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id          uuid primary key default gen_random_uuid(),
  building_id text references public.buildings(id),
  staff_id    uuid references public.staff(id) on delete cascade,
  type        text not null,                 -- Annual leave | Sick leave | Shift swap
  from_date   date, to_date date, days int not null default 1,
  status      text not null default 'Pending',  -- Pending | Approved | Declined
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.shift_templates enable row level security;
alter table public.leave_requests  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['shift_templates','leave_requests']
  loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Approve a request; for Annual/Sick leave, debit the staffer's taken balance. Atomic.
create or replace function public.approve_leave(p_id uuid)
returns void language plpgsql security invoker as $$
declare v public.leave_requests;
begin
  select * into v from public.leave_requests where id = p_id for update;
  if not found or v.status = 'Approved' then return; end if;
  update public.leave_requests set status = 'Approved' where id = p_id;
  if v.type in ('Annual leave','Sick leave') then
    update public.staff set taken = coalesce(taken,0) + coalesce(v.days,0) where id = v.staff_id;
  end if;
end $$;

grant execute on function public.approve_leave(uuid) to authenticated;
