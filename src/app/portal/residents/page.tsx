import Link from "next/link";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { ResidentsDirectory } from "@/components/portal/residents/residents-directory";
import { TierFilterPills } from "@/components/portal/residents/tier-filter-pills";
import { getResidents } from "@/lib/data/residents";
import { listBuildings } from "@/lib/data/buildings";

// Directory of everyone in care, read live from Supabase, split into one tab per
// home. Wesley leads because it is the larger register. Tier pills are a
// visual-only client island; the grid is not filtered by tier this phase.
export default async function ResidentsPage() {
  const [residents, buildings] = await Promise.all([getResidents(), listBuildings()]);
  const tabs = [...buildings].sort((a, b) => (a.id === "wesley" ? -1 : b.id === "wesley" ? 1 : 0));

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Residents"
        sub={`${residents.length} in care across ${tabs.length} homes`}
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
      <ResidentsDirectory residents={residents} buildings={tabs} />
    </div>
  );
}
