-- Soft-delete for app_users: removing an account sets deleted_at instead of
-- dropping the row, so it can be recovered. Active-account queries filter on
-- deleted_at is null; the partial index keeps that filter fast. Idempotent.
alter table public.app_users
  add column if not exists deleted_at timestamptz;

create index if not exists app_users_active_idx
  on public.app_users (created_at desc)
  where deleted_at is null;
