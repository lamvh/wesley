import { getStockGroups, getStockKpis } from "@/lib/mock-data";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { StockGroup } from "@/components/portal/stock/stock-group";

// Admin stock dashboard: level KPIs over four category groups. Read-only this
// phase; receive-delivery button is inert.
export default function StockPage() {
  const kpis = getStockKpis();
  const groups = getStockGroups();

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Stock & supplies"
        sub="Live inventory across clinical, continence, housekeeping & kitchen"
        actions={
          <Button className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90">
            + Receive delivery
          </Button>
        }
      />

      <div className="mt-[22px] grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {groups.map((group) => (
          <StockGroup key={group.category} group={group} />
        ))}
      </div>
    </div>
  );
}
