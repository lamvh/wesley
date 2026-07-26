"use client";

import { useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Type-to-filter picker used where a plain <select> stopped scaling: the item
// field (35 products) and the issue-to destination field (74 rooms across both
// homes). The visible input carries no `name` - the committed value is
// submitted through a hidden input, so what the user sees (a label) and what
// the form posts (an id) can differ.
//
// `allowFreeText` is the difference between the two callers: an item MUST
// resolve to a product id, but a destination may be somewhere that isn't in
// the room register at all (the kitchens, laundry), so typed text stands on
// its own there.

export interface SearchOption {
  /** Submitted/committed value. Must be unique within `options`. */
  value: string;
  /** Shown in the field once picked, and as the row's primary text. */
  label: string;
  /** Secondary text, right-aligned in the list. Also matched by the query. */
  hint?: string;
  /** Matched by the query but never displayed (aliases, codes). */
  keywords?: string;
}

/** Every whitespace-separated token must appear somewhere in the option. */
function matches(option: SearchOption, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const haystack = `${option.label} ${option.hint ?? ""} ${option.keywords ?? ""}`.toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

export function SearchSelect<T extends SearchOption>({
  options,
  value,
  onChange,
  name,
  placeholder,
  emptyLabel = "No matches",
  allowFreeText = false,
  ariaLabel,
  className,
  listClassName,
}: {
  options: T[];
  value: string;
  onChange: (value: string, option: T | null) => void;
  /** When set, the committed value posts under this form field name. */
  name?: string;
  placeholder?: string;
  emptyLabel?: string;
  allowFreeText?: boolean;
  ariaLabel?: string;
  className?: string;
  listClassName?: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // null = not editing, so the field shows the committed option's label
  // rather than whatever was last typed.
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value) ?? null;
  // Free-text callers keep the raw text as the value, so it doubles as its
  // own label when no option matches.
  const display = query ?? selected?.label ?? (allowFreeText ? value : "");

  const filtered = useMemo(() => {
    const tokens = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    return options.filter((o) => matches(o, tokens));
  }, [options, query]);

  function commit(option: T) {
    onChange(option.value, option);
    setQuery(null);
    setOpen(false);
    setActive(0);
  }

  function cancel() {
    setQuery(null);
    setOpen(false);
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (filtered.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + filtered.length) % filtered.length);
      return;
    }
    if (e.key === "Enter") {
      // Never let the picker submit the surrounding form.
      if (open && filtered[active]) {
        e.preventDefault();
        commit(filtered[active]);
      } else if (open) {
        e.preventDefault();
        setOpen(false);
      }
      return;
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      cancel();
    }
  }

  return (
    <div className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        value={display}
        placeholder={placeholder}
        className={className}
        onFocus={(e) => {
          setOpen(true);
          setActive(0);
          e.target.select();
        }}
        // Blur fires before a list click lands, so the list suppresses its own
        // mousedown (below) and this only runs for a genuine focus loss.
        onBlur={cancel}
        onChange={(e) => {
          const text = e.target.value;
          setQuery(text);
          setOpen(true);
          setActive(0);
          if (allowFreeText) onChange(text, null);
        }}
        onKeyDown={onKeyDown}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-[224px] overflow-y-auto rounded-[11px] border border-line bg-cream py-1 shadow-lg",
            listClassName,
          )}
        >
          {filtered.map((o, i) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => commit(o)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-[7px] text-left text-[13px] text-ink",
                  i === active && "bg-navy-tint",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="shrink-0 text-[11.5px] text-ink-faint">{o.hint}</span>}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-[9px] text-[12.5px] text-ink-faint">
              {allowFreeText ? `${emptyLabel} - will be saved as typed` : emptyLabel}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
