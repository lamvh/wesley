"use client";

import { useMemo, useState } from "react";
import { PersonBadge } from "@/components/shared/person-badge";
import { Icon } from "@/components/shared/icons";
import { staffContractMeta, staffStatusMeta } from "@/lib/design-meta";
import type { StaffRecord } from "@/types/domain";
import { cn } from "@/lib/utils";

const COLS = "grid-cols-[2fr_1fr_1fr_1.1fr_0.7fr_1fr_1fr_88px]";
const PAGE_SIZE = 6;

// Fallback swatches for any contract/status value outside the known sets -
// keeps the table rendering instead of erroring on unexpected data.
const FALLBACK_CONTRACT = { badge: "bg-muted text-ink-muted", text: "text-ink-muted", dot: "bg-ink-muted" };
const FALLBACK_STATUS = { text: "text-ink-muted", dot: "bg-ink-muted" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Visa expiry chip: red if expired, amber within 60 days, else green. Null when
// the visa type has no expiry (citizen/PR) or no date is recorded. Date is
// formatted manually (no locale) so SSR and client hydration agree.
function visaPill(visaType: string, visaExpiry: string): { text: string; cls: string } | null {
  const needsExp = visaType && visaType !== "NZ Citizen" && visaType !== "Permanent Resident";
  if (!needsExp || !visaExpiry) return null;
  const dd = new Date(`${visaExpiry}T00:00:00`);
  if (Number.isNaN(dd.getTime())) return null;
  const days = Math.round((dd.getTime() - Date.now()) / 86400000);
  const lab = `${String(dd.getDate()).padStart(2, "0")} ${MONTHS[dd.getMonth()]} ${dd.getFullYear()}`;
  if (days < 0) return { text: `Expired ${lab}`, cls: "bg-rust-tint text-rust" };
  if (days <= 60) return { text: `Expires ${lab}`, cls: "bg-gold-tint text-gold-text" };
  return { text: lab, cls: "bg-sage-tint text-sage" };
}

// Team directory: avatar+name+tenure, role, contract pill (+ weekly hours),
// visa (type + expiry chip), leave balance, phone, status dot, edit/delete.
// Searchable (name/role/contract/visa/phone/status) and paginated client-side.
export function TeamTab({
  staff,
  onEdit,
  onDelete,
}: {
  staff: StaffRecord[];
  onEdit: (s: StaffRecord) => void;
  onDelete: (s: StaffRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) =>
      [s.name, s.roles.join(" "), s.contract, s.visaType, s.phone, s.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [staff, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, pageCount - 1);
  const start = curPage * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const showing = filtered.length
    ? `${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`
    : `0 of ${staff.length}`;

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-[380px]">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search staff by name, role, contract…"
            className="w-full rounded-[11px] border border-line-soft bg-cream-2 px-[14px] py-[10px] text-[14px] text-ink outline-none focus:border-navy"
          />
        </div>
        <span className="text-[13px] text-ink-faint">{showing}</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-cream-2">
      <div className="min-w-[980px]">
        <div
          className={cn(
            "grid gap-[14px] border-b border-line-divider px-[22px] py-[14px] text-[12px] font-bold uppercase tracking-[0.4px] text-ink-faint",
            COLS,
          )}
        >
          <div>Name</div>
          <div>Role</div>
          <div>Contract</div>
          <div>Visa</div>
          <div>Leave left</div>
          <div>Contact</div>
          <div>Status</div>
          <div />
        </div>

        {rows.map((s) => {
          const contract = staffContractMeta[s.contract] ?? FALLBACK_CONTRACT;
          const status = staffStatusMeta[s.status] ?? FALLBACK_STATUS;
          const pill = visaPill(s.visaType, s.visaExpiry);
          return (
            <div
              key={s.id}
              className={cn(
                "grid items-center gap-[14px] border-b border-line-soft px-[22px] py-[15px] last:border-b-0",
                COLS,
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <PersonBadge
                  initials={s.initials}
                  color={s.color}
                  className="size-10 rounded-full text-[13.5px]"
                />
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-semibold text-ink">{s.name}</div>
                  <div className="text-[12px] text-ink-faint">Since {s.start}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-[5px]">
                {s.roles.length ? (
                  s.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full border border-line-soft bg-cream px-[9px] py-[2px] text-[12px] font-medium text-ink-soft"
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-[13.5px] text-ink-faint">-</span>
                )}
              </div>

              <div>
                <span className={cn("rounded-full px-[10px] py-1 text-[12px] font-bold", contract.badge)}>
                  {s.contract}
                </span>
                <div className="mt-[3px] text-[11.5px] text-ink-faint">{s.hours} hrs/wk</div>
              </div>

              <div className="min-w-0">
                <div className="truncate text-[13px] text-ink-soft">{s.visaType || "-"}</div>
                {pill && (
                  <span className={cn("mt-[3px] inline-block rounded-full px-[8px] py-[2px] text-[11px] font-semibold", pill.cls)}>
                    {pill.text}
                  </span>
                )}
              </div>

              <div>
                {(() => {
                  const remaining = Math.max(0, s.annual - s.taken);
                  const pct = s.annual > 0 ? Math.min(100, Math.round((s.taken / s.annual) * 100)) : 0;
                  return (
                    <>
                      <div className="text-[13.5px] text-ink-soft">
                        <span className="font-semibold text-ink">{remaining}</span> / {s.annual}
                      </div>
                      <div className="mt-[5px] h-[5px] w-[54px] overflow-hidden rounded-full bg-line">
                        <div
                          className={cn("h-full rounded-full", remaining <= 2 ? "bg-terracotta" : "bg-sage")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="text-[13px] text-ink-soft">{s.phone}</div>

              <div className="flex items-center gap-[7px]">
                <span className={cn("size-2 shrink-0 rounded-full", status.dot)} />
                <span className="text-[13.5px] text-ink-soft">{s.status}</span>
              </div>

              <div className="flex justify-end gap-[6px]">
                <button
                  type="button"
                  onClick={() => onEdit(s)}
                  title="Edit"
                  className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-line-soft bg-cream text-navy"
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(s)}
                  title="Remove"
                  className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-rust/25 bg-rust-tint text-rust"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-[22px] py-10 text-center text-[14px] text-ink-faint">
            {staff.length === 0 ? "No staff members yet." : "No staff match your search."}
          </div>
        )}
      </div>
      </div>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-end gap-[6px]">
          <button
            type="button"
            aria-label="Previous page"
            disabled={curPage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="flex size-9 items-center justify-center rounded-[9px] border border-line-soft bg-cream-2 text-[16px] text-ink-soft disabled:cursor-not-allowed disabled:text-line-strong"
          >
            ‹
          </button>
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={cn(
                "min-w-9 rounded-[9px] border px-[10px] py-[7px] text-[13.5px] font-semibold",
                i === curPage
                  ? "border-navy bg-navy text-cream"
                  : "border-line-soft bg-cream-2 text-ink-soft",
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={curPage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="flex size-9 items-center justify-center rounded-[9px] border border-line-soft bg-cream-2 text-[16px] text-ink-soft disabled:cursor-not-allowed disabled:text-line-strong"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
