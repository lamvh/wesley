-- Adds a required login username to app_users and makes the contact email
-- optional. Idempotent so it can be re-run safely. Username is citext so
-- comparisons are case-insensitive; the unique index enforces one per person.
alter table public.app_users
  add column if not exists username citext unique;

-- Contact email becomes optional (login can be by username alone). The unique
-- index still holds; Postgres allows many NULLs under a unique constraint.
alter table public.app_users
  alter column email drop not null;

-- Backfill username for existing rows from the local part of their email, then
-- enforce NOT NULL. Existing rows all have an email today, so this is safe.
update public.app_users
  set username = split_part(email::text, '@', 1)
  where username is null and email is not null;

alter table public.app_users
  alter column username set not null;
