-- Rename a role atomically. The role name is denormalised across staff.role
-- (primary), staff.roles[] and shift_templates.role (no FK cascades), so a
-- rename must update the registry row and every reference in one transaction.

create or replace function public.rename_role(p_building text, p_old text, p_new text)
returns void language plpgsql security invoker as $$
begin
  p_new := btrim(p_new);
  if p_new = '' or p_old = '' then
    raise exception 'Role name is required';
  end if;
  if p_old = p_new then
    return;
  end if;
  if not exists (select 1 from public.staff_roles where building_id = p_building and name = p_old) then
    raise exception 'Role "%" no longer exists', p_old;
  end if;
  if exists (select 1 from public.staff_roles where building_id = p_building and name = p_new) then
    raise exception 'Role "%" already exists', p_new;
  end if;

  -- registry row (keeps its colour/group/sort_order)
  update public.staff_roles set name = p_new
    where building_id = p_building and name = p_old;
  -- denormalised references on staff + shift templates
  update public.staff set role = p_new
    where building_id = p_building and role = p_old;
  update public.staff set roles = array_replace(roles, p_old, p_new)
    where building_id = p_building and p_old = any(roles);
  update public.shift_templates set role = p_new
    where building_id = p_building and role = p_old;
end $$;

grant execute on function public.rename_role(text, text, text) to authenticated;
