"use client";

import { cn } from "@/lib/utils";
import type { StaffFacetOption, StaffFacets, StaffFilter, StaffFilterAxis } from "@/lib/staff-filtering";

// Filter chips above the team directory: role group, status, contract.
// Multi-select within a row (OR), combined across rows (AND).
//
// Counts are computed with the chip's own row lifted, so a number reads as
// "what you'd get if you added this", not "what's left" - the latter drives
// every unselected chip in a row to 0 as soon as you pick one, which makes the
// row useless for switching between choices.

const chipBase =
  "flex items-center gap-[6px] rounded-full border px-[11px] py-[5px] text-[12.5px] font-semibold transition";

function Chip({
  option,
  active,
  onToggle,
}: {
  option: StaffFacetOption;
  active: boolean;
  onToggle: () => void;
}) {
  const empty = option.count === 0 && !active;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        chipBase,
        active
          ? "border-transparent text-cream"
          : "border-line-soft bg-cream text-ink-soft hover:border-line-strong",
        empty && "opacity-45",
      )}
      // Group chips carry the roster band's own colour so the two screens
      // stay recognisably the same grouping.
      style={active && option.color ? { backgroundColor: option.color } : undefined}
    >
      {!active && option.color && (
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
      )}
      <span>{option.label}</span>
      <span className={cn("text-[11.5px] font-bold", active ? "text-cream/70" : "text-ink-faint")}>
        {option.count}
      </span>
    </button>
  );
}

function Row({
  label,
  axis,
  options,
  filter,
  onToggle,
}: {
  label: string;
  axis: StaffFilterAxis;
  options: StaffFacetOption[];
  filter: StaffFilter;
  onToggle: (axis: StaffFilterAxis, value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-[7px]">
      <span className="w-[62px] shrink-0 text-[11.5px] font-bold uppercase tracking-[0.4px] text-ink-faint">
        {label}
      </span>
      {options.map((o) => (
        <Chip
          key={o.value}
          option={o}
          active={filter[axis].includes(o.value)}
          onToggle={() => onToggle(axis, o.value)}
        />
      ))}
    </div>
  );
}

export function TeamFilters({
  facets,
  filter,
  active,
  onToggle,
  onClear,
}: {
  facets: StaffFacets;
  filter: StaffFilter;
  active: boolean;
  onToggle: (axis: StaffFilterAxis, value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-line bg-cream-2 px-[18px] py-[14px]">
      <Row label="Group" axis="groups" options={facets.groups} filter={filter} onToggle={onToggle} />
      <Row label="Status" axis="statuses" options={facets.statuses} filter={filter} onToggle={onToggle} />
      <Row label="Contract" axis="contracts" options={facets.contracts} filter={filter} onToggle={onToggle} />
      {active && (
        <div>
          <button
            type="button"
            onClick={onClear}
            className="text-[12.5px] font-semibold text-bronze-text"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
