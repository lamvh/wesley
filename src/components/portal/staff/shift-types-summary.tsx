import type { ShiftTemplate } from "@/types/domain";

// Compact summary of every shift type at the top of the Shift-templates tab:
// one swatch + name + time per template. Swatch tint/border and the name colour
// are per-template DATA, applied inline (sanctioned color exception).
export function ShiftTypesSummary({ shifts }: { shifts: ShiftTemplate[] }) {
  if (shifts.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[13px] border border-line bg-cream-2 px-4 py-3">
      <span className="mr-[2px] text-[12px] font-bold uppercase tracking-[0.5px] text-ink-faint">
        Shift types
      </span>
      {shifts.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-[7px] text-[12.5px] text-ink-nav"
        >
          <span
            style={{ background: t.tint, borderColor: t.border }}
            className="size-[14px] rounded-[4px] border"
          />
          <b style={{ color: t.color }} className="font-bold">
            {t.name}
          </b>
          <span className="text-ink-faint">{t.time}</span>
        </span>
      ))}
    </div>
  );
}
