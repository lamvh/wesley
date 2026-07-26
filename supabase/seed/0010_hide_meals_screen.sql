-- Parks the Meals & dietary screen: off the nav for everyone, route closed.
-- Nothing is deleted - the screen comes back the moment a super_admin flips
-- it in /portal/settings. Recorded here so the starting state is reproducible
-- rather than a one-off click nobody can trace.
insert into public.screen_visibility (href, hidden) values
  ('/portal/meals', true)
on conflict (href) do update set hidden = excluded.hidden, updated_at = now();
