import type { ShiftType } from "@/types/domain";

// Legend bar: one swatch + code + time per shift type. Swatch tint/border and
// the code color are per-type DATA, applied inline (sanctioned color exception).
export function ShiftLegend({ legend }: { legend: ShiftType[] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[13px] border border-line bg-cream-2 px-4 py-3">
      <span className="mr-[2px] text-[12px] font-bold uppercase tracking-[0.5px] text-ink-faint">
        Shift types
      </span>
      {legend.map((s) => (
        <span
          key={s.id}
          className="inline-flex items-center gap-[7px] text-[12.5px] text-ink-nav"
        >
          <span
            style={{ background: s.tint, borderColor: s.border }}
            className="size-[14px] rounded-[4px] border"
          />
          <b style={{ color: s.color }} className="font-bold">
            {s.code}
          </b>
          <span className="text-ink-faint">{s.time}</span>
        </span>
      ))}
    </div>
  );
}
