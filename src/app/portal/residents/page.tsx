import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { ResidentCard } from "@/components/portal/residents/resident-card";
import { TierFilterPills } from "@/components/portal/residents/tier-filter-pills";
import { Button } from "@/components/ui/button";
import { getResidents } from "@/lib/mock-data";

// Directory of everyone in care. Tier pills are a visual-only client island;
// the grid is not filtered this phase.
export default function ResidentsPage() {
  const residents = getResidents();
  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Residents"
        sub="51 in care · 51 rooms occupied · 3 rooms available"
        actions={
          <>
            <TierFilterPills />
            <Button
              type="button"
              className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90"
            >
              + Admit
            </Button>
          </>
        }
      />
      <div className="mt-[22px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
        {residents.map((resident) => (
          <ResidentCard key={resident.slug} resident={resident} />
        ))}
      </div>
    </div>
  );
}
