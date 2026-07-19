-- New account role for staff who only handle stock/supplies ordering.
insert into public.roles (id, label, description, is_system) values
  ('stock_manager', 'Stock Manager', 'Stock & supplies ordering only', false)
on conflict (id) do nothing;
