-- Forms library: blank form templates (PDF/Word/…) managed by admins, shared
-- facility-wide. Files live in a private Storage bucket; this table holds the
-- metadata. Anchor for a future "fillable forms" phase (form_fields / submissions).

-- Private bucket for the blank template files.
insert into storage.buckets (id, name, public)
values ('form-templates', 'form-templates', false)
on conflict (id) do nothing;

-- Authenticated users may read/write objects in this bucket; admin gating lives
-- in the server actions (same MVP pattern as the app's table policies).
create policy form_templates_obj_read on storage.objects
  for select to authenticated using (bucket_id = 'form-templates');
create policy form_templates_obj_write on storage.objects
  for insert to authenticated with check (bucket_id = 'form-templates');
create policy form_templates_obj_delete on storage.objects
  for delete to authenticated using (bucket_id = 'form-templates');

create table if not exists public.form_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null
               check (category in (
                 'Admission & discharge','Care plan','Clinical & assessment',
                 'Consent','Incident & risk','Medication','HR & staff',
                 'Policy & procedure','Other')),
  description  text,
  file_path    text not null,
  file_name    text not null,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid references public.app_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.form_templates enable row level security;
create policy form_templates_read on public.form_templates
  for select to authenticated using (true);
create policy form_templates_write on public.form_templates
  for all to authenticated using (true) with check (true);
