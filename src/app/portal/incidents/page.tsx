import { getComplianceKpis, getIncidents } from "@/lib/mock-data";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { IncidentTable } from "@/components/portal/incidents/incident-table";

// Admin compliance dashboard: audit-readiness KPIs over the incidents log.
// Read-only this phase; report-incident button is inert.
export default function IncidentsPage() {
  const kpis = getComplianceKpis();
  const incidents = getIncidents();

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Incidents & compliance"
        sub="Ministry of Health certified · next audit 14 Sep 2026"
        actions={
          <Button className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90">
            + Report incident
          </Button>
        }
      />

      <div className="mt-[22px] grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <IncidentTable incidents={incidents} />
    </div>
  );
}
