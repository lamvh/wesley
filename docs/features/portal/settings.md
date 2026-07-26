# Settings

- **Route:** `/portal/settings` - `app/portal/settings/page.tsx`
- **Section:** Portal · Administration · **Access: super_admin only** (admins are refused too)
- **Render:** RSC page reads the hidden-screen list → client `ScreenVisibilityPanel` (optimistic switches)

## Purpose
Instance-wide switches that change the site for **every** user, not just this home's day-to-day running - which is why it sits above `requireAdmin()` on `requireSuperAdmin()`. Currently one panel: which portal screens are switched on.

## Screens panel
One row per hideable screen (`hideableScreens()` in `lib/portal-nav.ts` = `PORTAL_NAV` + `PORTAL_ADMIN_NAV` minus `ALWAYS_VISIBLE`), each with icon, label, href, a Visible/Hidden word and a `PermissionSwitch` borrowed from the permission grid. The switch flips optimistically and rolls back with an inline error if the server refuses.

**Switching a screen off is a real off, not an unlinked page:**
- Dropped from the sidebar and from the mobile tab bar + More sheet (`hiddenScreens` prop, threaded from `app/portal/layout.tsx`).
- Route closed in `lib/supabase/middleware.ts` - `pathname === href || pathname.startsWith(href + "/")`, so sub-routes go too (hiding Residents also closes `/portal/residents/ada-lovelace`). Enforced in middleware rather than per page so a screen added later can't ship without its guard.
- Nothing is deleted. Switching back on restores the screen exactly.

`ALWAYS_VISIBLE` (`/portal`, `/portal/settings`) is refused at three layers - the panel never lists them, the action rejects them, and the reader filters stale rows - because the dashboard is where a closed route redirects and Settings holds the switch: hiding either would strand a super_admin with no way back.

## Access
Three layers, because hiding the nav link is not a guard:
1. Nav - `superAdminOnly` on the nav item; `isSuperAdmin(me)` computed in the portal layout and passed to both navs.
2. Route - `page.tsx` redirects non-super-admins to `/portal`.
3. Write - `setScreenHidden` calls `requireSuperAdmin()` before touching the service-role client.

## Data flow
`getHiddenScreens()` (`lib/data/screen-visibility.ts`) reads `public.screen_visibility` with the session client. Writes go through `setScreenHidden(href, hidden)` (`lib/actions/screen-visibility.ts`) on the service-role client, then `revalidatePath("/portal", "layout")` - the nav lives in the layout, so every portal route re-renders.

**Fails open.** A read error returns "nothing hidden" rather than blanking the nav. This is a tidiness switch, not an access control - nothing here is kept private by being hidden - and a hiccup taking the whole portal's nav down would be far worse than a parked screen staying visible for a moment.

## Current state
**Meals & dietary is switched off** (`supabase/seed/0010_hide_meals_screen.sql`). The screen and its code are untouched; a super_admin can switch it back on at any time.

## Data model
`public.screen_visibility(href pk, hidden, updated_at, updated_by)` - `supabase/migrations/0029_screen_visibility.sql`. Only hidden screens get a row, so absence means visible and a screen added in code is on by default with nothing to backfill. RLS matches `role_permissions`: select-to-authenticated, **no write policy** (service-role only).

## Definition of Done
A super_admin can switch any screen off and on; an admin sees neither the nav item nor the page; a switched-off screen disappears from sidebar, tab bar and More sheet and its URL redirects to `/portal`; `/portal` and `/portal/settings` cannot be switched off. Verified by `scripts/db/verify-screen-visibility.mts` (7/7 PASS on the real DB; the two signed-in-session checks need a login passed as arguments). `tsc`/lint/`build` clean.
