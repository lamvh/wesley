import { PortalRoleProvider } from "@/lib/role-context";
import { BuildingProvider } from "@/lib/building-context";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { MobileTabBar } from "@/components/portal/mobile-tabbar";
import { AccessPending } from "@/components/portal/access-pending";
import { identityFromUser } from "@/lib/portal-identity";
import { getHiddenScreens } from "@/lib/data/screen-visibility";
import {
  getCurrentUser,
  canAccessPortal,
  toPortalRole,
  isSuperAdmin,
} from "@/lib/supabase/current-user";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware guarantees a signed-in user reaches here. Only assigned
  // (non-suspended) accounts see the portal; while the schema isn't applied
  // yet the lookup fails open (see getCurrentUser) so nobody is locked out.
  const me = await getCurrentUser();
  if (me && !canAccessPortal(me)) {
    return (
      <AccessPending
        email={me.email}
        suspended={me.appUser?.status === "Suspended"}
      />
    );
  }

  const initialRole = toPortalRole(me?.appUser?.role_id);
  const identity = identityFromUser(me?.appUser ?? null, initialRole);
  // Screens an admin has switched off. Read here rather than in each nav so
  // the sidebar and the tab bar can never disagree about what is showing.
  const hiddenScreens = await getHiddenScreens();
  const superAdmin = isSuperAdmin(me);

  return (
    <PortalRoleProvider initialRole={initialRole}>
      <BuildingProvider>
        <div className="flex min-h-screen bg-cream">
          <PortalSidebar identity={identity} hiddenScreens={hiddenScreens} isSuperAdmin={superAdmin} />
          <div className="flex min-w-0 flex-1 flex-col">
            <PortalTopbar />
            <main className="vscroll flex-1 p-[30px] max-[860px]:p-4 max-[860px]:pb-[84px]">
              {children}
            </main>
          </div>
          <MobileTabBar identity={identity} hiddenScreens={hiddenScreens} isSuperAdmin={superAdmin} />
        </div>
      </BuildingProvider>
    </PortalRoleProvider>
  );
}
