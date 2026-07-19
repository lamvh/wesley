-- Website CMS: editable marketing copy for the public site, stored as a single
-- JSONB override row merged over the code defaults at read time. Public (anon)
-- can read so the marketing pages render edited copy without a session; writes
-- are for authenticated staff (admin-gated in the app, matching the MVP RLS
-- style used elsewhere in this schema).

create table if not exists public.site_content (
  id         text primary key default 'site',
  content    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seed the single override row (empty = "use code defaults for everything").
insert into public.site_content (id, content) values ('site', '{}'::jsonb)
  on conflict (id) do nothing;

alter table public.site_content enable row level security;

-- Public read: the marketing site is anonymous, so anon + authenticated select.
drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content
  for select to anon, authenticated using (true);

-- Writes: authenticated staff only (admin gating enforced in the app layer).
drop policy if exists site_content_write on public.site_content;
create policy site_content_write on public.site_content
  for all to authenticated using (true) with check (true);
