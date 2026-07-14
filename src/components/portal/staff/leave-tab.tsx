import { PersonBadge } from "@/components/shared/person-badge";
import { Button } from "@/components/ui/button";
import { leaveStatusMeta } from "@/lib/design-meta";
import { cn } from "@/lib/utils";
import type { StaffLeaveRequest } from "@/types/domain";

// Fallback pill for any status value outside the known set — keeps the row
// rendering instead of erroring on unexpected data.
const FALLBACK_STATUS = { badge: "bg-muted text-ink-muted", text: "text-ink-muted", dot: "bg-ink-muted" };

// Leave-request directory: avatar + name·type, date range + day count, a
// status pill, an optional note, and Approve/Decline actions on Pending rows
// only (Approved/Declined rows are read-only history).
export function LeaveTab({
  leaves,
  onApprove,
  onDecline,
  pendingLeaveId,
}: {
  leaves: StaffLeaveRequest[];
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  pendingLeaveId?: string | null;
}) {
  if (leaves.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-cream-2 p-10 text-center text-[14px] text-ink-faint">
        No leave requests yet.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-cream-2 px-[22px]">
      {leaves.map((l) => {
        const status = leaveStatusMeta[l.status] ?? FALLBACK_STATUS;
        return (
          <div
            key={l.id}
            className="flex items-center gap-[14px] border-b border-line-divider py-4 last:border-b-0"
          >
            <PersonBadge
              initials={l.initials}
              color={l.color}
              className="size-[34px] shrink-0 rounded-full text-[12px]"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-ink">
                {l.name} · {l.type}
              </div>
              <div className="mt-[3px] text-[12.5px] text-ink-faint">
                {l.from} – {l.to} · {l.days} days
              </div>
              {l.note && <div className="mt-[3px] text-[12.5px] text-ink-soft">{l.note}</div>}
            </div>
            <span
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-[11px] py-1 text-[11.5px] font-bold",
                status.badge,
              )}
            >
              {l.status}
            </span>
            {l.status === "Pending" && (
              <div className="flex shrink-0 gap-2">
                <Button
                  onClick={() => onApprove(l.id)}
                  disabled={l.id === pendingLeaveId}
                  className="h-auto rounded-[9px] bg-sage-tint px-[14px] py-[7px] text-[13px] font-semibold text-sage hover:bg-sage-tint/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onDecline(l.id)}
                  disabled={l.id === pendingLeaveId}
                  className="h-auto rounded-[9px] border-line-soft bg-transparent px-[14px] py-[7px] text-[13px] font-semibold text-ink-meta hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
