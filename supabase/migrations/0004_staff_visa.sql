-- Staff visa tracking: work-visa type + expiry date per staff member.
-- Expiry is null for NZ Citizen / Permanent Resident (no visa to expire).

alter table public.staff
  add column if not exists visa_type   text,
  add column if not exists visa_expiry date;
