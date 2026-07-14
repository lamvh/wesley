-- Shift templates gain a role + paid hours. The role ties a template to the
-- role registry (staff_roles): the weekly roster only offers a template to a
-- staff member whose role shares the template role's group. paid_hours is the
-- per-shift payroll figure surfaced as "Nh paid" on the template card.

alter table public.shift_templates
  add column if not exists role       text,
  add column if not exists paid_hours numeric(5,2);

-- Backfill the seeded templates with a registry role + paid hours so the
-- role-constrained picker and the payroll label have data from first load.
update public.shift_templates set role = 'Carer',            paid_hours = 8    where id = 'sh1' and role is null;
update public.shift_templates set role = 'Care Taker',       paid_hours = 10   where id = 'sh2' and role is null;
update public.shift_templates set role = 'Carer',            paid_hours = 7.5  where id = 'sh3' and role is null;
update public.shift_templates set role = 'Registered Nurse', paid_hours = 8    where id = 'sh4' and role is null;
update public.shift_templates set role = 'Registered Nurse', paid_hours = 8    where id = 'sh5' and role is null;
update public.shift_templates set role = 'Team Leader',      paid_hours = 8    where id = 'sh6' and role is null;
