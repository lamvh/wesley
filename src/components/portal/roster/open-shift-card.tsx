// Dashed "gap" card shown in a shift column when a slot is unfilled.
// Terracotta dashed treatment + text pairs colour with a label (colour never
// the sole signal that a shift needs cover).
export function OpenShiftCard({ gap }: { gap: string }) {
  return (
    <div className="mt-1 flex items-center gap-3 rounded-[11px] border border-dashed border-terracotta bg-terracotta-tint/40 px-2 py-[10px]">
      <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-terracotta-tint text-[18px] font-bold text-bronze-text">
        +
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-bronze-text">
          Open shift
        </div>
        <div className="text-[12px] text-terracotta">{gap}</div>
      </div>
    </div>
  );
}
