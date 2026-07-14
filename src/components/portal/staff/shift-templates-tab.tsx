import { Icon } from "@/components/shared/icons";
import { ShiftTypesSummary } from "@/components/portal/staff/shift-types-summary";
import { getBuildingById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { RoleDef, ShiftTemplate } from "@/types/domain";

// Shift-template directory: compact cards (3 per row) grouped by building. Each
// card carries a role pill, "time · Nh paid" payroll line, a gap badge and a
// coverage bar. Role pill colours come from the role registry (Roles & groups).
export function ShiftTemplatesTab({
  shifts,
  roles,
  onEdit,
  onDelete,
  onAdd,
}: {
  shifts: ShiftTemplate[];
  roles: RoleDef[];
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

  // Role name -> pill colours from the registry (fallback to a neutral tone).
  const roleMeta = new Map(roles.map((r) => [r.name, r]));

  // Group templates by building, preserving first-seen order.
  const buildingIds: string[] = [];
  const byBuilding = new Map<string, ShiftTemplate[]>();
  for (const t of shifts) {
    if (!byBuilding.has(t.building)) {
      byBuilding.set(t.building, []);
      buildingIds.push(t.building);
    }
    byBuilding.get(t.building)!.push(t);
  }

  return (
    <div className="mt-6 flex flex-col gap-7">
      <ShiftTypesSummary shifts={shifts} />
      {buildingIds.map((bid) => {
        const group = byBuilding.get(bid)!;
        return (
          <div key={bid}>
            <div className="mb-[14px] flex items-center gap-[10px]">
              <span className="size-[11px] rounded-[3px] bg-navy-deep" />
              <h3 className="font-serif text-[20px] font-semibold text-ink">
                {getBuildingById(bid).name}
              </h3>
              <span className="rounded-full bg-gold-tint px-[10px] py-[3px] text-[11px] font-bold uppercase tracking-[0.4px] text-bronze">
                {group.length} {group.length === 1 ? "shift" : "shifts"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {group.map((t) => {
                const gap = t.req - t.filled;
                const staffed = gap <= 0;
                const pct = t.req > 0 ? Math.min(100, Math.round((t.filled / t.req) * 100)) : 0;
                const rm = roleMeta.get(t.role);
                const hoursLabel = t.paidHours ? `${t.paidHours}h paid` : "hours n/a";
                return (
                  <div key={t.id} className="rounded-[13px] border border-line bg-cream-2 px-[15px] py-[14px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-[10px] shrink-0 rounded-[3px] border"
                            style={{ background: t.tint, borderColor: t.border }}
                          />
                          <h4 className="truncate font-serif text-[16px] font-semibold text-ink">{t.name}</h4>
                        </div>
                        <div className="mt-[6px] flex flex-wrap items-center gap-x-2 gap-y-[5px]">
                          {t.role && (
                            <span
                              className="rounded-full px-2 py-[2px] text-[10px] font-bold"
                              style={{ color: rm?.color ?? "#5B5347", background: rm?.tint ?? "#EFE7D7" }}
                            >
                              {t.role}
                            </span>
                          )}
                          <span className="text-[12px] text-ink-faint">
                            {t.time}
                            {t.time && " · "}
                            {hoursLabel}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-full px-[9px] py-[2px] text-[10.5px] font-bold",
                          staffed ? "bg-sage-tint text-sage" : "bg-rust-tint text-rust",
                        )}
                      >
                        {staffed ? "Fully staffed" : `${gap} open`}
                      </span>
                    </div>

                    <div className="mb-[6px] mt-[13px] flex items-center justify-between">
                      <span className="text-[11.5px] font-semibold text-ink-soft">Coverage</span>
                      <span className="text-[12px] font-bold text-ink">
                        {t.filled} / {t.req}
                      </span>
                    </div>
                    <div className="h-[6px] overflow-hidden rounded-full bg-line">
                      <div
                        className={cn("h-full rounded-full", staffed ? "bg-sage" : "bg-terracotta")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-[13px] flex justify-end gap-[6px]">
                      <button
                        type="button"
                        onClick={() => onEdit(t)}
                        title="Edit"
                        className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-line-soft bg-cream text-navy"
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(t)}
                        title="Remove"
                        className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-rust/25 bg-rust-tint text-rust"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
