import { cn } from "@/lib/utils";

// One fact tile on the resident profile (Age / Mobility / Diet / GP). The Age
// value renders slightly larger than the rest.
export function StatTile({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line-soft bg-cream px-4 py-[14px]">
      <div className="text-[12px] text-ink-meta">{label}</div>
      <div
        className={cn(
          "mt-[3px] font-semibold text-ink",
          emphasis ? "text-[19px]" : "text-[16px]",
        )}
      >
        {value}
      </div>
    </div>
  );
}
