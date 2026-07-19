"use client";

import type { CmsKind } from "@/lib/website-cms-config";

// One labelled CMS input. `list` and `ml` render a textarea; `list` values are
// one item per line (the parent joins/splits the string[]).
export function CmsField({
  label,
  kind,
  value,
  onChange,
}: {
  label: string;
  kind?: CmsKind;
  value: string;
  onChange: (value: string) => void;
}) {
  const cls =
    "w-full rounded-[10px] border border-input bg-cream px-[13px] py-[11px] text-[14.5px] text-ink outline-none focus:border-navy";
  const multiline = kind === "ml" || kind === "list";
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-meta">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-y leading-[1.5]`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </div>
  );
}
