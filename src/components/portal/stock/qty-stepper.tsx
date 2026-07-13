import { cn } from "@/lib/utils";

// Order-cart quantity control: decrement / current qty / increment.
// Qty reads muted until at least one unit is added.
export function QtyStepper({
  qty,
  onInc,
  onDec,
}: {
  qty: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-[6px]">
      <button
        type="button"
        onClick={onDec}
        aria-label="Remove one"
        className="size-[30px] rounded-lg border border-line-soft bg-cream text-[18px] leading-none text-ink-nav"
      >
        −
      </button>
      <span
        className={cn(
          "min-w-[30px] text-center text-[14.5px] font-bold",
          qty ? "text-ink" : "text-ink-faint",
        )}
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={onInc}
        aria-label="Add one"
        className="size-[30px] rounded-lg border border-navy/20 bg-navy-tint text-[18px] leading-none text-navy"
      >
        +
      </button>
    </div>
  );
}
