import { PersonBadge } from "@/components/shared/person-badge";
import { Button } from "@/components/ui/button";
import type { LeaveRequest } from "@/types/domain";

// One pending leave/swap request: avatar, name·type, dates, and inert
// Approve / Decline actions (no mutation this phase).
export function LeaveRequestRow({ request }: { request: LeaveRequest }) {
  return (
    <div className="flex items-center gap-[14px] border-b border-line-divider py-3">
      <PersonBadge
        initials={request.initials}
        color={request.color}
        className="size-[34px] rounded-full text-[12px]"
      />
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-ink">
          {request.name} · {request.type}
        </div>
        <div className="text-[12.5px] text-ink-faint">{request.dates}</div>
      </div>
      <div className="flex gap-2">
        <Button className="h-auto rounded-[9px] bg-sage-tint px-[14px] py-[7px] text-[13px] font-semibold text-sage hover:bg-sage-tint/80">
          Approve
        </Button>
        <Button
          variant="outline"
          className="h-auto rounded-[9px] border-line-soft bg-transparent px-[14px] py-[7px] text-[13px] font-semibold text-ink-meta hover:bg-cream"
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
