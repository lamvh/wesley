import { createClient } from "@/lib/supabase/server";
import { ALWAYS_VISIBLE } from "@/lib/portal-nav";

// Which portal screens an admin has switched off (public.screen_visibility).
// Only hidden screens have a row, so this reads as a small deny-list rather
// than a full visibility map that would need backfilling per screen.

/** Hrefs currently hidden from the nav.
 *
 * Fails OPEN - an unreachable table or a missing migration returns "nothing
 * hidden" rather than blanking the nav. This is a tidiness switch, not an
 * access control: hiding a screen is not how anything here is kept private,
 * and a read error taking the whole portal down would be far worse than a
 * screen the admin meant to park staying visible for a moment.
 */
export async function getHiddenScreens(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("screen_visibility")
    .select("href, hidden")
    .eq("hidden", true);

  if (error || !data) return [];
  // A screen that can never be hidden must not be hideable by a stale row
  // either - otherwise one bad write locks an admin out of the switch itself.
  return data.map((r) => r.href).filter((href) => !ALWAYS_VISIBLE.includes(href));
}
