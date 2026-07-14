import Link from "next/link";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { ResidentCard } from "@/components/portal/residents/resident-card";
import { TierFilterPills } from "@/components/portal/residents/tier-filter-pills";
import { getResidents } from "@/lib/data/residents";

// Directory of everyone in care, read live from Supabase. Tier pills are a
// visual-only client island; the grid is not filtered this phase.
export default async function ResidentsPage() {
  const residents = await getResidents();
  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Residents"
        sub={`${residents.length} in care`}
        actions={
          <>
            <TierFilterPills />
            <Link
              href="/portal/residents/new"
              className="rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90"
            >
              + Admit
            </Link>
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
