import { PortalRoleProvider } from "@/lib/role-context";
import { BuildingProvider } from "@/lib/building-context";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { MobileTabBar } from "@/components/portal/mobile-tabbar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalRoleProvider>
      <BuildingProvider>
        <div className="flex min-h-screen bg-cream">
          <PortalSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <PortalTopbar />
            <main className="vscroll flex-1 p-[30px] max-[860px]:p-4 max-[860px]:pb-[84px]">
              {children}
            </main>
          </div>
          <MobileTabBar />
        </div>
      </BuildingProvider>
    </PortalRoleProvider>
  );
}
