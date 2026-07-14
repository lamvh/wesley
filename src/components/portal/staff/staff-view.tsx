"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getBuildingById } from "@/lib/mock-data";
import { useBuilding } from "@/lib/building-context";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { approveLeave, declineLeave, deleteLeave, deleteStaff, deleteShiftTemplate } from "@/lib/actions/staff";
import { TeamTab } from "@/components/portal/staff/team-tab";
import { StaffForm } from "@/components/portal/staff/staff-form";
import { RolesGroupsTab } from "@/components/portal/staff/roles-groups-tab";
import { ShiftTemplatesTab } from "@/components/portal/staff/shift-templates-tab";
import { ShiftTemplateForm } from "@/components/portal/staff/shift-template-form";
import { LeaveTab } from "@/components/portal/staff/leave-tab";
import { LeaveForm } from "@/components/portal/staff/leave-form";
import { PayrollTab } from "@/components/portal/staff/payroll-tab";
import { ConfirmDeleteModal } from "@/components/portal/stock/confirm-delete-modal";
import type { PayrollHours } from "@/lib/data/payroll";
import type {
  StaffRecord, ShiftTemplate, StaffLeaveRequest, RoleDef, RoleGroup, Kpi,
} from "@/types/domain";

type Tab = "team" | "roles" | "shifts" | "leave" | "payroll";

const TABS: { key: Tab; label: string }[] = [
  { key: "team", label: "Team" },
  { key: "roles", label: "Roles & groups" },
  { key: "shifts", label: "Shift templates" },
  { key: "leave", label: "Leave requests" },
  { key: "payroll", label: "Payroll" },
];

interface StaffViewProps {
  staff: StaffRecord[];
  shifts: ShiftTemplate[];
  leaves: StaffLeaveRequest[];
  roles: RoleDef[];
  groups: RoleGroup[];
  payrollHours: Record<string, PayrollHours>;
  weekStartISO: string;
  weekLabel: string;
  initialTab?: Tab;
}

export function StaffView({
  staff, shifts, leaves, roles, groups, payrollHours, weekStartISO, weekLabel, initialTab,
}: StaffViewProps) {
  const { buildingId } = useBuilding();
  const buildingName = getBuildingById(buildingId).name;

  const [tab, setTab] = useState<Tab>(initialTab ?? "team");

  const kpis: Kpi[] = [
    { label: "Total staff", value: String(staff.length), sub: "on the team" },
    {
      label: "On shift today",
      value: String(staff.filter((s) => s.status === "Active").length),
      sub: "rostered & active",
    },
    {
      label: "On leave",
      value: String(staff.filter((s) => s.status === "On leave").length),
      sub: "approved absence",
    },
    {
      label: "Pending requests",
      value: String(leaves.filter((l) => l.status === "Pending").length),
      sub: "awaiting review",
    },
  ];

  // Staff form: staffFormOpen + editStaff together decide add vs edit —
  // editStaff stays null for "+ Add staff".
  const [staffFormOpen, setStaffFormOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffRecord | null>(null);
  // Staff-form role choices come from the registry (managed in the Roles &
  // groups tab). roleCounts drives the per-role staff tallies on that tab.
  const roleOptions = roles.map((r) => r.name);
  const roleCounts = staff.reduce<Record<string, number>>((acc, s) => {
    for (const r of s.roles) acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});
  // Shift-template form: same add/edit pattern as the staff form.
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [editShift, setEditShift] = useState<ShiftTemplate | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ label: string; onConfirm: () => void } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Leave form: add-only (requests are resolved via Approve/Decline, never
  // edited), plus an inline banner for approve/decline failures.
  const [leaveFormOpen, setLeaveFormOpen] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  // Tracks the leave request currently being approved/declined so its row's
  // buttons can be disabled — guards against a double-click double-approving.
  const [pendingLeaveId, setPendingLeaveId] = useState<string | null>(null);

  function onHeaderAction() {
    if (tab === "team") {
      setEditStaff(null);
      setStaffFormOpen(true);
    } else if (tab === "shifts") {
      setEditShift(null);
      setShiftFormOpen(true);
    } else if (tab === "leave") {
      setLeaveFormOpen(true);
    }
  }

  async function handleApproveLeave(id: string) {
    setLeaveError(null);
    setPendingLeaveId(id);
    const fd = new FormData();
    fd.set("id", id);
    try {
      await approveLeave(fd);
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setPendingLeaveId(null);
    }
  }

  async function handleDeclineLeave(id: string) {
    setLeaveError(null);
    setPendingLeaveId(id);
    const fd = new FormData();
    fd.set("id", id);
    try {
      await declineLeave(fd);
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setPendingLeaveId(null);
    }
  }

  function closeStaffForm() {
    setStaffFormOpen(false);
    setEditStaff(null);
  }

  function openEditStaff(s: StaffRecord) {
    setEditStaff(s);
    setStaffFormOpen(true);
  }

  function closeShiftForm() {
    setShiftFormOpen(false);
    setEditShift(null);
  }

  function openEditShift(t: ShiftTemplate) {
    setEditShift(t);
    setShiftFormOpen(true);
  }

  function openAddShift() {
    setEditShift(null);
    setShiftFormOpen(true);
  }

  function requestDeleteStaff(s: StaffRecord) {
    setConfirmError(null);
    setConfirmDelete({
      label: s.name,
      onConfirm: async () => {
        const fd = new FormData();
        fd.set("id", s.id);
        try {
          await deleteStaff(fd);
          setConfirmDelete(null);
          setConfirmError(null);
        } catch (e) {
          setConfirmError(e instanceof Error ? e.message : String(e));
        }
      },
    });
  }

  function requestDeleteLeave(l: StaffLeaveRequest) {
    setConfirmError(null);
    setConfirmDelete({
      label: `${l.name} · ${l.type}`,
      onConfirm: async () => {
        const fd = new FormData();
        fd.set("id", l.id);
        try {
          await deleteLeave(fd);
          setConfirmDelete(null);
          setConfirmError(null);
        } catch (e) {
          setConfirmError(e instanceof Error ? e.message : String(e));
        }
      },
    });
  }

  function requestDeleteShift(t: ShiftTemplate) {
    setConfirmError(null);
    setConfirmDelete({
      label: t.name,
      onConfirm: async () => {
        const fd = new FormData();
        fd.set("id", t.id);
        try {
          await deleteShiftTemplate(fd);
          setConfirmDelete(null);
          setConfirmError(null);
        } catch (e) {
          setConfirmError(e instanceof Error ? e.message : String(e));
        }
      },
    });
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        eyebrow="Administration"
        title="Staff"
        sub={`${buildingName} · manage your team and shift coverage`}
        actions={
          tab === "roles" || tab === "payroll" ? undefined : (
            <Button
              onClick={onHeaderAction}
              className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90"
            >
              {tab === "shifts" ? "+ Add shift" : tab === "leave" ? "+ Add leave" : "+ Add staff"}
            </Button>
          )
        }
      />

      <div className="mt-[22px] grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-5 inline-flex gap-1 rounded-full border border-line-soft bg-toggle-track p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-[18px] py-[9px] text-[14px] font-semibold transition",
              tab === t.key ? "bg-navy-deep text-cream" : "text-ink-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "team" && (
        <TeamTab staff={staff} onEdit={openEditStaff} onDelete={requestDeleteStaff} />
      )}
      {tab === "roles" && (
        <RolesGroupsTab roles={roles} groups={groups} roleCounts={roleCounts} />
      )}
      {tab === "shifts" && (
        <ShiftTemplatesTab
          shifts={shifts}
          roles={roles}
          onEdit={openEditShift}
          onDelete={requestDeleteShift}
          onAdd={openAddShift}
        />
      )}
      {tab === "leave" && (
        <>
          {leaveError && (
            <p role="alert" className="mt-4 rounded-[10px] border border-rust/30 bg-rust-tint px-[13px] py-[10px] text-[13px] font-medium text-rust">
              {leaveError}
            </p>
          )}
          <LeaveTab
            leaves={leaves}
            staff={staff}
            onApprove={handleApproveLeave}
            onDecline={handleDeclineLeave}
            onRemove={requestDeleteLeave}
            pendingLeaveId={pendingLeaveId}
          />
        </>
      )}
      {tab === "payroll" && (
        <PayrollTab
          staff={staff}
          roles={roles}
          payrollHours={payrollHours}
          buildingName={buildingName}
          weekStartISO={weekStartISO}
          weekLabel={weekLabel}
        />
      )}

      {staffFormOpen && (
        <StaffForm
          staff={editStaff}
          roleOptions={roleOptions}
          roleDefs={roles}
          groups={groups}
          onClose={closeStaffForm}
        />
      )}
      {shiftFormOpen && <ShiftTemplateForm shift={editShift} roles={roles} onClose={closeShiftForm} />}
      {leaveFormOpen && <LeaveForm staff={staff} onClose={() => setLeaveFormOpen(false)} />}
      <ConfirmDeleteModal
        open={confirmDelete !== null}
        label={confirmDelete?.label ?? ""}
        error={confirmError ?? undefined}
        onCancel={() => {
          setConfirmDelete(null);
          setConfirmError(null);
        }}
        onConfirm={confirmDelete?.onConfirm ?? (() => {})}
      />
    </div>
  );
}
