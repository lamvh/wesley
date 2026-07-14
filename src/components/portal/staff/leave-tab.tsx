import { Icon } from "@/components/shared/icons";
import { PersonBadge } from "@/components/shared/person-badge";
import { Button } from "@/components/ui/button";
import { leaveStatusMeta } from "@/lib/design-meta";
import { cn } from "@/lib/utils";
import type { StaffLeaveRequest, StaffRecord } from "@/types/domain";

// Fallback pill for any status value outside the known set.
const FALLBACK_STATUS = { badge: "bg-muted text-ink-muted", text: "text-ink-muted", dot: "bg-ink-muted" };

// "2026-07-18" -> "18 Jul". Non-ISO / empty inputs pass through unchanged.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ""}`.trim();
}

// The dates line: "18 Jul – 25 Jul · 5 shifts · Family trip" (day count read as
// shifts; a single-day request shows one date and "1 shift").
function leaveDates(l: StaffLeaveRequest): string {
  const range = l.to && l.to !== l.from ? `${fmtDate(l.from)} – ${fmtDate(l.to)}` : fmtDate(l.from);
  const shifts = `${l.days} ${l.days === 1 ? "shift" : "shifts"}`;
  const base = [range, shifts].filter(Boolean).join(" · ");
  return l.note ? `${base} · ${l.note}` : base;
}

// Annual-leave balance bar colour: red when nearly exhausted, amber when low.
function balanceColor(remaining: number): string {
  if (remaining <= 2) return "bg-terracotta";
  if (remaining <= 5) return "bg-amber";
  return "bg-sage";
}

// Leave requests (left) paired with per-staff annual-leave balances (right).
// Each request shows avatar + name·type, a dates·shifts·note line, a status
// pill or Approve/Decline actions (Pending only), and a remove button.
export function LeaveTab({
  leaves,
  staff,
  onApprove,
  onDecline,
  onRemove,
  pendingLeaveId,
}: {
  leaves: StaffLeaveRequest[];
  staff: StaffRecord[];
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  onRemove: (l: StaffLeaveRequest) => void;
  pendingLeaveId?: string | null;
}) {
  const pendingCount = leaves.filter((l) => l.status === "Pending").length;

  return (
    <div className="mt-6 grid grid-cols-[1.35fr_1fr] gap-4 max-lg:grid-cols-1">
      {/* Left: requests */}
      <div className="rounded-2xl border border-line bg-cream-2 px-[22px] py-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-[19px] font-semibold text-ink">Leave requests</h3>
          {pendingCount > 0 && (
            <span className="rounded-full bg-gold-tint px-[11px] py-1 text-[11.5px] font-bold text-gold-text">
              {pendingCount} pending
            </span>
          )}
        </div>

        {leaves.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-ink-faint">No leave requests yet.</p>
        ) : (
          <div className="mt-2">
            {leaves.map((l) => {
              const status = leaveStatusMeta[l.status] ?? FALLBACK_STATUS;
              return (
                <div
                  key={l.id}
                  className="flex items-center gap-[13px] border-b border-line-divider py-4 last:border-b-0"
                >
                  <PersonBadge
                    initials={l.initials}
                    color={l.color}
                    className="size-[38px] shrink-0 rounded-full text-[13px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-ink">
                      {l.name} · {l.type}
                    </div>
                    <div className="mt-[3px] text-[12.5px] text-ink-faint">{leaveDates(l)}</div>
                  </div>
                  {l.status === "Pending" ? (
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
                  ) : (
                    <span
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-[11px] py-1 text-[11.5px] font-bold",
                        status.badge,
                      )}
                    >
                      {l.status}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(l)}
                    title="Remove"
                    className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-rust/25 bg-rust-tint text-rust"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: annual leave balances */}
      <div className="rounded-2xl border border-line bg-cream-2 px-[22px] py-5">
        <h3 className="font-serif text-[19px] font-semibold text-ink">Annual leave balance</h3>
        <p className="mt-[3px] text-[12.5px] text-ink-faint">Days taken this year, per staff member.</p>
        <div className="mt-3">
          {staff.map((s) => {
            const remaining = Math.max(0, s.annual - s.taken);
            const pct = s.annual > 0 ? Math.min(100, Math.round((s.taken / s.annual) * 100)) : 0;
            return (
              <div key={s.id} className="border-b border-line-divider py-[13px] last:border-b-0">
                <div className="flex items-center gap-[11px]">
                  <PersonBadge
                    initials={s.initials}
                    color={s.color}
                    className="size-[34px] shrink-0 rounded-full text-[12px]"
                  />
                  <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{s.name}</span>
                  <span className="shrink-0 text-[12.5px] text-ink-soft">
                    <span className="font-bold text-ink">{remaining}</span> of {s.annual} left
                  </span>
                </div>
                <div className="mt-[9px] h-[7px] overflow-hidden rounded-full bg-line">
                  <div
                    className={cn("h-full rounded-full", balanceColor(remaining))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
