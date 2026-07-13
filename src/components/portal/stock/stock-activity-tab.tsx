import type { StockActionKind, StockActivityEntry } from "@/types/domain";
import { Icon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

// Per-kind icon + colour so each action type is scannable at a glance.
const KIND_META: Record<
  StockActionKind,
  { icon: string; color: string; tint: string; label: string }
> = {
  order_placed: { icon: "stock", color: "text-navy", tint: "bg-navy-tint", label: "Order" },
  reorder_autofill: { icon: "activities", color: "text-sage", tint: "bg-sage-tint", label: "Reorder" },
  stock_adjusted: { icon: "meals", color: "text-amber", tint: "bg-amber-tint", label: "Adjust" },
  cart_cleared: { icon: "close", color: "text-ink-muted", tint: "bg-muted", label: "Cleared" },
};

// Chronological log of every material stock action. Newest first.
export function StockActivityTab({ entries }: { entries: StockActivityEntry[] }) {
  return (
    <div className="mt-6 rounded-2xl border border-line bg-cream-2 p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-serif text-[20px] font-semibold text-ink">Activity log</h2>
        <span className="text-[13px] text-ink-faint">{entries.length} actions</span>
      </div>
      <p className="mb-4 text-[13.5px] text-ink-muted">
        Every order, reorder and stock adjustment is recorded here for a clear
        audit trail.
      </p>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-10 text-center text-[14px] text-ink-faint">
          No stock activity yet.
        </div>
      ) : (
        <ol className="flex flex-col">
          {entries.map((e, i) => {
            const m = KIND_META[e.kind];
            return (
              <li
                key={e.id}
                className={cn(
                  "flex items-start gap-3 py-[14px]",
                  i > 0 && "border-t border-line-divider",
                )}
              >
                <span
                  className={cn(
                    "mt-[2px] flex size-9 shrink-0 items-center justify-center rounded-[10px]",
                    m.tint,
                    m.color,
                  )}
                >
                  <Icon name={m.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-[2px]">
                    <span className="text-[14.5px] font-semibold text-ink-soft">{e.summary}</span>
                    <span className={cn("rounded-full px-2 py-[1px] text-[11px] font-semibold", m.tint, m.color)}>
                      {m.label}
                    </span>
                  </div>
                  <div className="text-[13px] text-ink-muted">{e.detail}</div>
                </div>
                <div className="shrink-0 text-right leading-[1.3]">
                  <div className="text-[12.5px] font-medium text-ink-nav">{e.at}</div>
                  <div className="text-[11.5px] text-ink-faint">{e.actor}</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
