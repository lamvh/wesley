import { redirect } from "next/navigation";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { ScreenVisibilityPanel } from "@/components/portal/settings/screen-visibility-panel";
import { getHiddenScreens } from "@/lib/data/screen-visibility";
import { getCurrentUser, isSuperAdmin } from "@/lib/supabase/current-user";

// Super-admin settings. Currently one panel - which portal screens are switched
// on - and the home for further instance-wide switches as they arrive.
//
// Guarded here as well as in the nav: hiding the link does not close the route,
// and this screen can switch off every other screen in the portal.
export default async function SettingsPage() {
  if (!isSuperAdmin(await getCurrentUser())) redirect("/portal");

  const hiddenScreens = await getHiddenScreens();

  return (
    <div className="mx-auto max-w-[860px]">
      <PortalPageHeader
        title="Settings"
        sub="Instance-wide switches · applies to every user"
      />
      <div className="mt-[22px]">
        <ScreenVisibilityPanel hiddenScreens={hiddenScreens} />
      </div>
    </div>
  );
}
