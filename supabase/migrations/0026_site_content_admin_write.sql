-- Website CMS writes become admin-only.
--
-- `site_content` backs the PUBLIC marketing site, but its write policy was
-- `for all to authenticated using (true) with check (true)` - any signed-in
-- account (a carer, a family login) could rewrite the homepage. The original
-- comment said admin gating was "enforced in the app layer"; it never was, and
-- hiding the nav item behind `adminOnly` only concealed the route.
--
-- Dropping the write policy leaves regular sessions with SELECT only. Writes now
-- go exclusively through the service-role client in lib/actions/site-content.ts,
-- which bypasses RLS and is gated by requireAdmin() - the same shape already
-- used by roles, role_permissions and form templates.
--
-- Public read is unchanged: the marketing site is anonymous.

drop policy if exists site_content_write on public.site_content;

-- Left deliberately without a write policy. RLS stays enabled, so with no
-- matching policy every insert/update/delete from anon or authenticated is
-- refused; only the service-role key gets through.
