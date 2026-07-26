"use client";

import { useEffect, useState } from "react";
import type { Birthday, PortalRole } from "@/types/domain";
import { usePortalRole } from "@/lib/role-context";
import { getDashboard } from "@/lib/mock-data";
import { KpiCard } from "@/components/shared/kpi-card";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { Button } from "@/components/ui/button";
import { BirthdayStrip } from "./birthday-strip";
import { NeedsAttention } from "./needs-attention";
import { DashboardSkeleton } from "./dashboard-skeleton";

// Portal landing screen. Same skeleton for both roles; greeting, sub, the 4
// KPIs and the alert set swap with the active role. Birthdays are shared and
// come from the real register. Header buttons are inert this phase.
//
// "Today's programme" and "Recent family messages" used to sit below. Both
// were hardcoded mock rows - Peggy W., George A., "Mei's 90th" - none of whom
// are in either register, presented next to live occupancy and birthday data.
// Removed rather than left dangling; git has them if a real source arrives.
export function DashboardView({ birthdays }: { birthdays: Birthday[] }) {
  const { role } = usePortalRole();
  // Remount the body on role change (key) so the loading→render cycle re-runs
  // cleanly without a setState inside the effect.
  return <DashboardBody key={role} role={role} birthdays={birthdays} />;
}

function DashboardBody({ role, birthdays }: { role: PortalRole; birthdays: Birthday[] }) {
  const [loading, setLoading] = useState(true);

  // Explicit loading → render transition. Today getDashboard() is synchronous
  // mock data; this settle window stands in for the async Supabase query that
  // will replace it, so the skeleton path is real.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <DashboardSkeleton />;

  const data = getDashboard(role);

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title={data.greeting}
        sub={data.sub}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-auto rounded-[11px] border-line bg-cream-2 px-4 py-[11px] text-[14px] font-semibold text-ink-nav"
            >
              Handover notes
            </Button>
            <Button
              type="button"
              className="h-auto rounded-[11px] border-transparent bg-navy px-4 py-[11px] text-[14px] font-semibold text-cream hover:bg-navy/90"
            >
              + New entry
            </Button>
          </>
        }
      />

      <div className="mt-[26px] grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <BirthdayStrip birthdays={birthdays} />

      <div className="mt-4">
        <NeedsAttention alerts={data.alerts} />
      </div>
    </div>
  );
}
