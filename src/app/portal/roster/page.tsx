import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { LeaveRequestRow } from "@/components/portal/roster/leave-request-row";
import { ShiftColumn } from "@/components/portal/roster/shift-column";
import { Button } from "@/components/ui/button";
import {
  getLeaveRequests,
  getRosterCoverage,
  getShifts,
} from "@/lib/mock-data";

// Daily staffing board: three shift columns + pending leave/swap requests.
export default function RosterPage() {
  const shifts = getShifts();
  const leaveRequests = getLeaveRequests();

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Roster & shifts"
        sub={`Saturday, 11 July · ${getRosterCoverage()}`}
        actions={
          <>
            <Button className="h-auto rounded-[11px] border border-line-soft bg-cream-2 px-[15px] py-[9px] text-[14px] font-semibold text-ink-nav hover:bg-cream">
              Week view
            </Button>
            <Button className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90">
              + Assign shift
            </Button>
          </>
        }
      />

      <div className="mt-[22px] grid grid-cols-1 gap-4 md:grid-cols-3">
        {shifts.map((shift) => (
          <ShiftColumn key={shift.name} shift={shift} />
        ))}
      </div>

      <section className="mt-4 rounded-[16px] border border-line bg-cream-2 p-[22px]">
        <h2 className="font-serif text-[20px] font-semibold text-ink">
          Leave & requests
        </h2>
        <div className="mt-3 flex flex-col gap-[2px]">
          {leaveRequests.map((request) => (
            <LeaveRequestRow key={request.name} request={request} />
          ))}
        </div>
      </section>
    </div>
  );
}
