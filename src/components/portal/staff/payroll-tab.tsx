"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRoleRate } from "@/lib/actions/roles";
import { shiftWeek } from "@/lib/mock-data";
import { PersonBadge } from "@/components/shared/person-badge";
import type { RoleDef, StaffRecord } from "@/types/domain";
import type { PayrollHours } from "@/lib/data/payroll";

interface PayrollTabProps {
  staff: StaffRecord[];
  roles: RoleDef[];
  payrollHours: Record<string, PayrollHours>;
  buildingName: string;
  weekStartISO: string;
  weekLabel: string;
}

const money = (n: number) =>
  "$" + n.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round1 = (n: number) => Math.round(n * 10) / 10;

// Admin Payroll tab: editable per-role hourly rates × paid hours from the weekly
// roster grid give each person's hours + gross pay, grouped by building with a
// total wage bill. Hours come from the server (roster is the source of truth);
// rates are edited here and recompute gross live before persisting.
export function PayrollTab({
  staff, roles, payrollHours, buildingName, weekStartISO, weekLabel,
}: PayrollTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [rates, setRates] = useState<Record<string, number>>(
    () => Object.fromEntries(roles.map((r) => [r.name, r.hourlyRate])),
  );
  const [rateError, setRateError] = useState<string | null>(null);

  const roleMeta = new Map(roles.map((r) => [r.name, r]));
  const roleIndex = new Map(roles.map((r, i) => [r.name, i]));

  const persistRate = (name: string, value: number) => {
    setRateError(null);
    startTransition(async () => {
      try {
        await saveRoleRate(name, value);
      } catch (e) {
        setRateError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  // Per-person payroll rows (own primary-role rate × rostered paid hours).
  const rows = staff
    .map((s) => {
      const role = s.roles[0] ?? "";
      const rate = rates[role] ?? 0;
      const ph = payrollHours[s.id];
      const hours = ph?.hours ?? 0;
      const shiftCount = ph?.shiftCount ?? 0;
      return { s, role, rate, hours, shiftCount, gross: hours * rate };
    })
    .sort((a, b) =>
      (roleIndex.get(a.role) ?? 999) - (roleIndex.get(b.role) ?? 999) ||
      a.s.name.localeCompare(b.s.name),
    );

  const totalHours = rows.reduce((n, r) => n + r.hours, 0);
  const totalGross = rows.reduce((n, r) => n + r.gross, 0);
  const headcount = rows.filter((r) => r.hours > 0).length;
  const avg = headcount ? totalHours / headcount : 0;
  const subHours = totalHours;
  const subGross = totalGross;

  const kpis = [
    { label: "Weekly wage bill", value: money(totalGross), sub: "gross · before tax", color: "#232A4C" },
    { label: "Paid hours", value: `${round1(totalHours)}h`, sub: "rostered this week", color: "#3F5137" },
    { label: "Rostered staff", value: String(headcount), sub: "with shifts this week", color: "#2C5A6E" },
    { label: "Avg hours / person", value: `${round1(avg)}h`, sub: "this pay week", color: "#93502F" },
  ];

  const gotoWeek = (delta: number) =>
    router.push(`/portal/staff?staffTab=payroll&week=${shiftWeek(weekStartISO, delta)}`);

  const colClass = "grid grid-cols-[1.7fr_1.2fr_70px_70px_84px_104px] gap-[14px] px-5";

  return (
    <div className="mt-6">
      {/* Hourly rates editor */}
      <div className="rounded-[16px] border border-line bg-cream-2 px-[22px] py-[18px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-[19px] font-semibold text-ink">Hourly rates</h3>
            <p className="mt-[3px] text-[12.5px] text-ink-faint">
              Rate per role in NZD. Editing any rate recalculates every wage below.
            </p>
          </div>
          <div className="flex items-center gap-[10px]">
            <div className="flex overflow-hidden rounded-[10px] border border-line-soft">
              <button
                type="button" aria-label="Previous week" onClick={() => gotoWeek(-1)}
                className="border-r border-line-soft bg-cream px-3 py-[6px] text-[15px] font-semibold text-ink-nav hover:bg-cream-2"
              >‹</button>
              <button
                type="button" aria-label="Next week" onClick={() => gotoWeek(1)}
                className="bg-cream px-3 py-[6px] text-[15px] font-semibold text-ink-nav hover:bg-cream-2"
              >›</button>
            </div>
            <span className="rounded-full bg-gold-tint px-[12px] py-[5px] text-[11.5px] font-bold uppercase tracking-[0.5px] text-bronze-text">
              {weekLabel}
            </span>
          </div>
        </div>
        {rateError && (
          <p role="alert" className="mt-3 rounded-[10px] border border-rust/30 bg-rust-tint px-[13px] py-[9px] text-[13px] font-medium text-rust">
            {rateError}
          </p>
        )}
        <div className="mt-[14px] flex flex-wrap gap-[10px]">
          {roles.map((r) => (
            <div key={r.name} className="flex items-center gap-[10px] rounded-[11px] border border-line bg-cream px-3 py-2">
              <span className="size-[9px] shrink-0 rounded-[3px]" style={{ background: r.color }} />
              <span className="text-[12.5px] font-bold text-ink">{r.name}</span>
              <span className="flex items-center gap-[3px]">
                <span className="text-[13px] text-ink-faint">$</span>
                <input
                  type="number" min="0" step="0.25"
                  value={rates[r.name] ?? 0}
                  onChange={(e) => setRates((p) => ({ ...p, [r.name]: parseFloat(e.target.value) || 0 }))}
                  onBlur={(e) => persistRate(r.name, parseFloat(e.target.value) || 0)}
                  className="w-[62px] rounded-[8px] border border-field bg-cream-2 px-[7px] py-[6px] text-[14px] font-bold text-ink outline-none"
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-4 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[16px] border border-line bg-cream-2 px-5 py-[18px]">
            <div className="text-[13px] font-semibold text-ink-soft">{k.label}</div>
            <div className="mt-[6px] font-serif text-[30px] leading-none" style={{ color: k.color }}>{k.value}</div>
            <div className="mt-1 text-[12.5px] text-ink-faint">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Per-building table (single building this phase) */}
      <div className="mt-5">
        <div className="mb-3 flex items-center gap-[11px]">
          <span className="size-[10px] rounded-full bg-navy-deep" />
          <h3 className="font-serif text-[20px] font-semibold text-ink">{buildingName}</h3>
          <span className="rounded-full bg-gold-tint px-[11px] py-1 text-[11.5px] font-bold uppercase tracking-[0.5px] text-bronze-text">
            {headcount} rostered
          </span>
        </div>
        <div className="overflow-x-auto rounded-[16px] border border-line bg-cream-2">
          <div className="min-w-[660px]">
            <div className={`${colClass} border-b border-line py-[13px] text-[12px] font-bold uppercase tracking-[0.4px] text-ink-faint`}>
              <div>Staff</div><div>Role</div>
              <div className="text-right">Shifts</div><div className="text-right">Hours</div>
              <div className="text-right">Rate/hr</div><div className="text-right">Gross pay</div>
            </div>
            {rows.map(({ s, role, rate, hours, shiftCount, gross }) => {
              const rm = roleMeta.get(role);
              return (
                <div key={s.id} className={`${colClass} items-center border-b border-line-divider py-[13px]`}>
                  <div className="flex min-w-0 items-center gap-[11px]">
                    <PersonBadge initials={s.initials} color={s.color} className="size-[34px] rounded-full text-[12.5px]" />
                    <span className="truncate text-[14.5px] font-semibold text-ink">{s.name}</span>
                  </div>
                  <div>
                    {role && (
                      <span className="rounded-full px-[10px] py-1 text-[11.5px] font-bold"
                        style={{ color: rm?.color ?? "#5B5347", background: rm?.tint ?? "#EFE7D7" }}>
                        {role}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-[13.5px] text-ink-soft">{shiftCount}</div>
                  <div className="text-right text-[14px] font-semibold text-ink">{round1(hours)}h</div>
                  <div className="text-right text-[13.5px] text-ink-soft">{money(rate)}</div>
                  <div className="text-right font-serif text-[15px] font-bold text-navy-deep">{money(gross)}</div>
                </div>
              );
            })}
            <div className={`${colClass} items-center bg-cream py-[13px]`}>
              <div className="text-[12.5px] font-bold uppercase tracking-[0.4px] text-ink-soft">{buildingName} subtotal</div>
              <div /><div />
              <div className="text-right text-[14px] font-bold text-ink">{round1(subHours)}h</div>
              <div />
              <div className="text-right font-serif text-[15px] font-bold text-navy-deep">{money(subGross)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Total footer */}
      <div className="mt-[18px] flex flex-wrap items-center justify-between gap-4 rounded-[16px] bg-navy-deep px-6 py-[18px]">
        <div className="font-serif text-[19px] text-cream">Total weekly payroll</div>
        <div className="flex items-baseline gap-[22px]">
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-sidebar-muted">Paid hours</div>
            <div className="font-serif text-[26px] text-cream">{round1(totalHours)}h</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-gold">Gross pay</div>
            <div className="font-serif text-[30px] text-white">{money(totalGross)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
