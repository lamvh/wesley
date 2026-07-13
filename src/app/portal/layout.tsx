import { PortalRoleProvider } from "@/lib/role-context";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalTopbar } from "@/components/portal/portal-topbar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalRoleProvider>
      <div className="flex min-h-screen bg-cream">
        <PortalSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopbar />
          <main className="vscroll flex-1 p-[30px]">{children}</main>
        </div>
      </div>
    </PortalRoleProvider>
  );
}
