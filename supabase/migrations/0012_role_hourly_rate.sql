-- Per-role hourly pay rate, used by the Staff → Payroll tab to turn rostered
-- paid hours into gross wages. Editable from the Payroll tab; 0 until set.
alter table public.staff_roles
  add column if not exists hourly_rate numeric(6,2) not null default 0;

-- Sensible starting rates (NZD/hr) for the seeded roles so the screen reads
-- meaningfully out of the box; admins adjust from the Payroll tab. Only seed
-- rows still at the 0 default so re-running never clobbers edited rates.
update public.staff_roles set hourly_rate = 42    where building_id = 'wesley' and name = 'Registered Nurse' and hourly_rate = 0;
update public.staff_roles set hourly_rate = 26.50 where building_id = 'wesley' and name = 'Carer'            and hourly_rate = 0;
update public.staff_roles set hourly_rate = 32    where building_id = 'wesley' and name = 'Team Leader'      and hourly_rate = 0;
update public.staff_roles set hourly_rate = 26.50 where building_id = 'wesley' and name = 'Care Taker'       and hourly_rate = 0;
update public.staff_roles set hourly_rate = 24.50 where building_id = 'wesley' and name = 'Kitchen'          and hourly_rate = 0;
update public.staff_roles set hourly_rate = 25    where building_id = 'wesley' and name = 'Activities'       and hourly_rate = 0;
