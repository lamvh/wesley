import { Icon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import type { ShiftTemplate } from "@/types/domain";

// Shift-template directory: swatch + name + time, a gap badge ("N open" vs
// "Fully staffed"), and a coverage bar (filled/req). Two-column grid per
// .design-src/victoria-at-mt-eden.dc.html ~L1365-1378; the edit action isn't
// in that markup but is required so admins can adjust required/filled counts.
export function ShiftTemplatesTab({
  shifts,
  onEdit,
  onDelete,
  onAdd,
}: {
  shifts: ShiftTemplate[];
  onEdit: (t: ShiftTemplate) => void;
  onDelete: (t: ShiftTemplate) => void;
  onAdd: () => void;
}) {
  if (shifts.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-cream-2 p-10 text-center">
        <p className="text-[14px] text-ink-faint">No shift templates yet.</p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 cursor-pointer rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream"
        >
          + Add shift
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
      {shifts.map((t) => {
        const gap = t.req - t.filled;
        const staffed = gap <= 0;
        const pct = t.req > 0 ? Math.min(100, (t.filled / t.req) * 100) : 0;
        return (
          <div key={t.id} className="rounded-2xl border border-line bg-cream-2 px-[22px] py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-[9px]">
                  <span
                    className="size-3 shrink-0 rounded-[4px] border"
                    style={{ background: t.tint, borderColor: t.border }}
                  />
                  <h3 className="truncate font-serif text-[19px] font-semibold text-ink">{t.name}</h3>
                </div>
                <div className="mt-[5px] text-[13px] text-ink-faint">{t.time}</div>
              </div>
              <span
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-[11px] py-1 text-[11.5px] font-bold",
                  staffed ? "bg-sage-tint text-sage" : "bg-rust-tint text-rust",
                )}
              >
                {staffed ? "Fully staffed" : `${gap} open`}
              </span>
            </div>

            <div className="mb-[7px] mt-4 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-ink-soft">Coverage</span>
              <span className="text-[13px] font-bold text-ink">
                {t.filled}/{t.req}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div
                className={cn("h-full rounded-full", staffed ? "bg-sage" : "bg-terracotta")}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-4 flex justify-end gap-[6px]">
              <button
                type="button"
                onClick={() => onEdit(t)}
                title="Edit"
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-line-soft bg-cream text-navy"
              >
                <Icon name="edit" size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(t)}
                title="Remove"
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-rust/25 bg-rust-tint text-rust"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
