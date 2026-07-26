"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RosterGrid } from "@/components/portal/roster/roster-grid";
import { DutyRosterModal } from "@/components/portal/roster/duty-roster-modal";
import { DutyRosterPreview } from "@/components/portal/roster/duty-roster-preview";
import { StaffForm } from "@/components/portal/staff/staff-form";
import {
  dailyTotals,
  rosterWeekTitle,
  shiftWeek,
  totalShifts,
} from "@/lib/mock-data";
import {
  clearOnCallDay,
  clearRosterCell,
  copyPreviousWeek,
  setOnCallDay,
  toggleRosterShift,
} from "@/lib/actions/roster";
import {
  groupStaffForRoster,
  rosterPickersFor,
  shiftRequirementByBand,
} from "@/lib/roster-grouping";
import { staffDisplayName } from "@/lib/staff-display";
import { usePersistedToggle } from "@/lib/use-persisted-toggle";
import {
  DUTY_DEFAULTS,
  buildDutySheets,
  dutyDayOptions,
  dutySheetTitle,
} from "@/lib/duty-roster";
import type {
  DutyForm,
  RoleDef,
  RoleGroup,
  RosterDay,
  RosterGrid as RosterGridState,
  ShiftType,
  ShiftUsageByStaff,
  StaffRecord,
} from "@/types/domain";
import { rosterCellKey } from "@/types/domain";

/** Where the show-times preference is kept, so it survives the remount that
 *  every week change triggers. */
const SHOW_TIMES_KEY = "wesley.roster.showTimes";

interface RosterViewProps {
  staff: StaffRecord[];
  days: RosterDay[];
  initialGrid: RosterGridState;
  shiftTypes: ShiftType[];
  roles: RoleDef[];
  groups: RoleGroup[];
  weekStartISO: string;
  /** on-call staff id per date ISO, persisted for the visible week. */
  initialOnCallByDay: Record<string, string>;
  /** per-staff shift counts over the weeks before this one, backing the
   *  "Thường làm" shortcut in the picker. */
  shiftUsage: ShiftUsageByStaff;
  /** open the duty-roster print preview on mount (roster?duty=1 deep-link). */
  initialDutyPreview?: boolean;
}

// Weekly roster scheduler: real staff × 7-day grid with an assignable shift
// picker per cell. Cell keys are `${staffId}::${dateISO}`. Assignments auto-save
// to Supabase on every toggle (optimistic local update + server action), and the
// visible week is navigated via ?week= so persisted data reloads per week.
export function RosterView({
  staff,
  days,
  initialGrid,
  shiftTypes,
  roles,
  groups,
  weekStartISO,
  initialOnCallByDay,
  shiftUsage,
  initialDutyPreview = false,
}: RosterViewProps) {
  const router = useRouter();
  const [grid, setGrid] = useState<RosterGridState>(initialGrid);
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  // Staff record whose detail form is open, or null when closed. Mounted only
  // while set - StaffForm derives all its state at mount, so switching target
  // means remounting (same idiom the Staff screen uses).
  const [editStaff, setEditStaff] = useState<StaffRecord | null>(null);

  // Most shift templates are named after their own hours ("6:45 - 15:15",
  // "TL: 16:15 - 22:45"), so the chip's time line just repeats the name. Off by
  // default for that reason; a handful do carry a real name ("Chef", "Night",
  // "Morning + Stock") and this brings their hours back. Persisted because
  // RosterView is keyed on the week and remounts every time it changes.
  const [showTimes, toggleTimes] = usePersistedToggle(SHOW_TIMES_KEY, false);
  const [isPending, startTransition] = useTransition();

  // On-call carer per day (keyed by day ISO, value = staff id). The picker
  // offers nurses first, then HCAs. Auto-saves to Supabase on every change,
  // mirroring the shift-cell grid's optimistic-update + server-action pattern.
  const [onCallByDay, setOnCallByDay] = useState<Record<string, string>>(initialOnCallByDay);
  const setOnCall = (dateISO: string, value: string) => {
    setOnCallByDay((prev) => {
      const next = { ...prev };
      if (value) next[dateISO] = value;
      else delete next[dateISO];
      return next;
    });
    startTransition(() => {
      void (value ? setOnCallDay(dateISO, value) : clearOnCallDay(dateISO));
    });
  };

  // "Export duty roster" flow: config modal -> full-screen A4 print preview.
  const [dutyOpen, setDutyOpen] = useState(false);
  const [dutyPreview, setDutyPreview] = useState(initialDutyPreview);
  const [dutyForm, setDutyForm] = useState<DutyForm>({ ...DUTY_DEFAULTS });
  const patchDuty = (patch: Partial<DutyForm>) => setDutyForm((prev) => ({ ...prev, ...patch }));

  // Picker vocabulary is the real shift templates. `defs` indexes them by id for
  // the grid cells; the per-cell picker consumes `shiftTypes` via rosterPickersFor.
  const defs = Object.fromEntries(shiftTypes.map((s) => [s.id, s]));

  // Staff are banded into their role group (Nurses & HCAs → Care Takers → …)
  // so the roster reads by role, not a flat alphabetical list.
  const bands = groupStaffForRoster(staff, roles, groups);

  // Shift slots each band has to cover per day, so the grid can flag a day that
  // is short. Derived from the templates' own `req`, not a separate setting.
  const bandRequired = shiftRequirementByBand(roles, shiftTypes);

  // On-call options follow the band order, so nurses & HCAs surface first.
  const onCallOptions = bands.flatMap((b) =>
    b.staff.map((s) => ({
      value: s.id,
      label: staffDisplayName(s),
      initials: s.initials,
      color: s.color,
    })),
  );

  // Per-staff shift picker: a flat list of shifts filtered to the staffer's own
  // role group, in canonical order (see rosterPickersFor).
  const pickers = rosterPickersFor(staff, roles, shiftTypes, groups);

  const totals = dailyTotals(
    staff.map((s) => s.id),
    days,
    grid,
  );
  const total = totalShifts(grid);
  const weekTitle = rosterWeekTitle(days);

  // Resolve on-call staff id -> name for the print sheet (onCallOptions' label).
  const onCallNames = Object.fromEntries(onCallOptions.map((o) => [o.value, o.label]));
  const onCallNameByDay = Object.fromEntries(
    Object.entries(onCallByDay).map(([iso, staffId]) => [iso, onCallNames[staffId] ?? ""]),
  );

  // Duty sheets rebuild whenever the grid, on-call, or export config changes.
  const dutySheets = useMemo(
    () => buildDutySheets(bands, days, grid, shiftTypes, roles, groups, dutyForm, onCallNameByDay),
    [bands, days, grid, shiftTypes, roles, groups, dutyForm, onCallNameByDay],
  );
  const dutyTitle = dutySheetTitle(days, dutyForm);
  const dayOptions = dutyDayOptions(days);

  const openRosterCell = (key: string) =>
    setOpenCell((prev) => (prev === key ? null : key));

  const gotoWeek = (delta: number) =>
    router.push(`/portal/roster?week=${shiftWeek(weekStartISO, delta)}`);

  // key is `${staffId}::${dateISO}` - split back out for the server action.
  const cellParts = (key: string) => {
    const i = key.indexOf("::");
    return { staffId: key.slice(0, i), dateISO: key.slice(i + 2) };
  };

  const toggleShift = (key: string, shiftId: string) => {
    setGrid((prev) => {
      const next = { ...prev };
      const ids = [...(next[key] ?? [])];
      const i = ids.indexOf(shiftId);
      if (i >= 0) ids.splice(i, 1);
      else ids.push(shiftId);
      if (ids.length === 0) delete next[key];
      else next[key] = ids;
      return next;
    });
    // Close on pick: a cell holds one shift in ~98% of cases, so staying open
    // just means an extra click to dismiss. Stacking a second shift means
    // reopening the cell, which is the rarer path.
    setOpenCell(null);
    const { staffId, dateISO } = cellParts(key);
    startTransition(() => {
      void toggleRosterShift(staffId, dateISO, shiftId);
    });
  };

  // Pull last week's assignments forward - the whole grid, or one staffer's row
  // when `staffId` is given. The action returns only what it actually added
  // (existing shifts are never touched), so merging its result is enough and no
  // refetch is needed. router.refresh() wouldn't help here anyway: `grid` is
  // seeded state and the view only remounts when the week changes.
  const copyWeek = (staffId?: string) => {
    setCopyNote(null);
    startTransition(async () => {
      const res = await copyPreviousWeek(weekStartISO, staffId);
      if (res.added.length) {
        setGrid((prev) => {
          const next = { ...prev };
          for (const a of res.added) {
            const key = rosterCellKey(a.staffId, a.dateISO);
            const ids = next[key] ?? [];
            if (!ids.includes(a.shiftId)) next[key] = [...ids, a.shiftId];
          }
          return next;
        });
      }
      setCopyNote(
        res.message ??
          `Đã chép ${res.added.length} ca từ tuần trước${staffId ? " cho nhân viên này" : ""}.`,
      );
    });
  };

  const clearCell = (key: string) => {
    setGrid((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setOpenCell(null);
    const { staffId, dateISO } = cellParts(key);
    startTransition(() => {
      void clearRosterCell(staffId, dateISO);
    });
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] font-medium text-ink">
            Roster & shifts
          </h1>
          <p className="mt-[5px] text-[15px] text-ink-muted">
            {weekTitle} · {staff.length} staff · {total} shifts assigned
          </p>
          {copyNote && (
            <p role="status" className="mt-[6px] text-[13px] font-medium text-ink-nav">
              {copyNote}
            </p>
          )}
        </div>
        <div className="flex items-center gap-[10px]">
          <div className="flex overflow-hidden rounded-[11px] border border-line-soft">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => gotoWeek(-1)}
              className="border-r border-line-soft bg-cream-2 px-[13px] py-2 text-[16px] font-semibold text-ink-nav hover:bg-cream"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => gotoWeek(1)}
              className="bg-cream-2 px-[13px] py-2 text-[16px] font-semibold text-ink-nav hover:bg-cream"
            >
              ›
            </button>
          </div>
          <Button
            variant="outline"
            onClick={toggleTimes}
            aria-pressed={showTimes}
            title={
              showTimes
                ? "Ẩn dòng giờ trên chip ca (đa số tên ca đã có sẵn giờ)"
                : "Hiện dòng giờ trên chip ca"
            }
            className="h-auto rounded-[11px] border-line-soft bg-cream-2 px-[15px] py-[9px] text-[14px] font-semibold text-ink-nav hover:bg-cream"
          >
            {showTimes ? "Ẩn giờ" : "Hiện giờ"}
          </Button>
          <Button
            variant="outline"
            onClick={() => copyWeek()}
            disabled={isPending}
            title="Thêm ca của tuần trước vào tuần này (không ghi đè ca đã có)"
            className="h-auto rounded-[11px] border-line-soft bg-cream-2 px-[15px] py-[9px] text-[14px] font-semibold text-ink-nav hover:bg-cream"
          >
            Copy tuần trước
          </Button>
          <Button
            variant="outline"
            onClick={() => setDutyOpen(true)}
            className="h-auto rounded-[11px] border-line-soft bg-cream-2 px-[15px] py-[9px] text-[14px] font-semibold text-ink-nav hover:bg-cream"
          >
            Export duty roster
          </Button>
          <Button
            onClick={() => setPublished(true)}
            className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90"
          >
            {published ? "Published ✓" : "Publish roster"}
          </Button>
        </div>
      </div>

      {staff.length === 0 ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-line-strong bg-cream-2 px-6 py-[40px] text-center text-[14px] text-ink-muted">
          No staff yet - add team members in Staff to roster them here.
        </div>
      ) : (
        <RosterGrid
          bands={bands}
          days={days}
          grid={grid}
          defs={defs}
          pickers={pickers}
          totals={totals}
          onCallByDay={onCallByDay}
          onCallOptions={onCallOptions}
          onOnCall={setOnCall}
          openCell={openCell}
          onOpen={openRosterCell}
          onClose={() => setOpenCell(null)}
          onToggle={toggleShift}
          onClear={clearCell}
          shiftUsage={shiftUsage}
          bandRequired={bandRequired}
          showTimes={showTimes}
          onOpenStaff={(s) => {
            // Dismiss any open cell picker first, so it isn't left hanging
            // behind the modal.
            setOpenCell(null);
            setEditStaff(s);
          }}
          onCopyStaffWeek={(staffId) => copyWeek(staffId)}
          copyPending={isPending}
        />
      )}

      <DutyRosterModal
        open={dutyOpen}
        form={dutyForm}
        dayOptions={dayOptions}
        onScope={(scope) => patchDuty({ scope })}
        onDay={(day) => patchDuty({ day })}
        onCancel={() => setDutyOpen(false)}
        onGenerate={() => {
          setDutyOpen(false);
          setDutyPreview(true);
        }}
      />
      <DutyRosterPreview
        open={dutyPreview}
        sheets={dutySheets}
        title={dutyTitle}
        onPrint={() => window.print()}
        onClose={() => setDutyPreview(false)}
      />
      {/* Staff detail, opened from a roster row. Same modal the Staff screen
          uses, so there is one place editing a staffer is defined. It closes
          itself on a successful save; saveStaff revalidates /portal/roster, so
          a changed name, colour or role band lands back on the grid. */}
      {editStaff && (
        <StaffForm
          staff={editStaff}
          roleOptions={roles.map((r) => r.name)}
          roleDefs={roles}
          groups={groups}
          onClose={() => setEditStaff(null)}
        />
      )}
    </div>
  );
}
