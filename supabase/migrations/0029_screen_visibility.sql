-- Lets an admin take a portal screen off the nav without a deploy.
--
-- Only hidden screens get a row: absence means visible, so a screen added in
-- code is on by default and nothing has to be backfilled. Keyed on the nav
-- href because that is what the sidebar, the tab bar and the route guard all
-- already hold.

create table if not exists public.screen_visibility (
  href       text primary key,
  hidden     boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.app_users(id)
);

-- Same posture as role_permissions: readable by any signed-in session (the
-- layout needs it on every render), writable only by the service role behind
-- requireAdmin() - see lib/actions/screen-visibility.ts.
alter table public.screen_visibility enable row level security;

drop policy if exists screen_visibility_read on public.screen_visibility;
create policy screen_visibility_read on public.screen_visibility
  for select to authenticated using (true);
