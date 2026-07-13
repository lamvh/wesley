import { cn } from "@/lib/utils";
import type { Shift, ShiftName } from "@/types/domain";
import { OpenShiftCard } from "./open-shift-card";
import { StaffRow } from "./staff-row";

// Per-shift wash tone for the card head (subtle, differs per service).
const headBg: Record<ShiftName, string> = {
  Morning: "bg-sage-tint/60",
  Afternoon: "bg-amber-tint/50",
  Night: "bg-terracotta-tint/40",
};

// One shift card: tinted head (name + time + status pill) over staff rows,
// plus the open-shift gap card when the shift is short.
export function ShiftColumn({ shift }: { shift: Shift }) {
  const statusClasses = shift.full
    ? "text-sage bg-sage-tint"
    : "text-rust bg-rust-tint";

  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-cream-2">
      <div
        className={cn(
          "flex items-center justify-between gap-[10px] border-b border-line px-[18px] py-4",
          headBg[shift.name],
        )}
      >
        <div className="flex-1">
          <div className="text-[16px] font-bold text-ink">{shift.name}</div>
          <div className="text-[12.5px] text-ink-meta">{shift.time}</div>
        </div>
        <div
          className={cn(
            "rounded-full px-[11px] py-[5px] text-[12px] font-semibold",
            statusClasses,
          )}
        >
          {shift.status}
        </div>
      </div>
      <div className="p-3">
        {shift.staff.map((member) => (
          <StaffRow key={member.name} member={member} />
        ))}
        {shift.gap && <OpenShiftCard gap={shift.gap} />}
      </div>
    </div>
  );
}
