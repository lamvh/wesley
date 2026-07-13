import { KpiCard } from "@/components/shared/kpi-card";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { WingGroup } from "@/components/portal/rooms/wing-group";
import { Button } from "@/components/ui/button";
import { getRoomKpis, getRoomWings } from "@/lib/mock-data";

// Admin overview of every room, grouped by wing. Admin-only nav is hidden for
// staff, so this renders its content unconditionally this phase.
export default function RoomsPage() {
  const kpis = getRoomKpis();
  const wings = getRoomWings();
  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Rooms"
        sub="Every room ties together its resident, supplies and daily programme"
        actions={
          <Button
            type="button"
            className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90"
          >
            + Manage rooms
          </Button>
        }
      />
      <div className="mt-[22px] grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
      <div className="mt-[22px] flex flex-col gap-2">
        {wings.map((wing) => (
          <WingGroup key={wing.name} {...wing} />
        ))}
      </div>
    </div>
  );
}
