import { cn } from "@/lib/utils";
import { alertToneMeta } from "@/lib/design-meta";
import type { Alert } from "@/types/domain";

// Alert card: each row carries a tone-colored 3px left border + dot + tag pill.
// The left-border color is derived from the tone's text class so it stays in
// sync with the dot/pill without a separate mapping.
export function NeedsAttention({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
      <div className="flex items-center justify-between">
        <h3 className="m-0 font-serif text-[20px] font-semibold">Needs attention</h3>
        <span className="cursor-pointer text-[13px] font-semibold text-bronze-text">
          View all
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-[10px]">
        {alerts.map((a) => {
          const meta = alertToneMeta[a.tone];
          // Left accent only; other three sides stay the soft card border.
          const leftBorderClass = meta.text.replace("text-", "border-l-");
          return (
            <div
              key={a.title}
              className={cn(
                "flex items-center gap-[14px] rounded-[11px] border-y border-r border-l-[3px] border-line-soft bg-cream px-[15px] py-[13px]",
                leftBorderClass,
              )}
            >
              <div className={cn("size-[9px] shrink-0 rounded-full", meta.dot)} />
              <div className="flex-1">
                <div className="text-[14.5px] font-semibold text-ink-soft">{a.title}</div>
                <div className="mt-[2px] text-[13px] text-ink-muted">{a.detail}</div>
              </div>
              <div
                className={cn(
                  "whitespace-nowrap rounded-full px-[10px] py-[5px] text-[12px] font-semibold",
                  meta.badge,
                )}
              >
                {a.tag}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
