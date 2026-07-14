"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { saveProvider } from "@/lib/actions/stock";
import type { Provider } from "@/types/domain";

const CATEGORIES = [
  "Clinical & PPE",
  "Continence",
  "Kitchen & Nutrition",
  "Housekeeping",
  "Other",
] as const;

const fieldCls =
  "rounded-[11px] border border-input bg-cream-2 px-[14px] py-[10px] text-[14.5px] text-ink outline-none focus:border-navy";
const labelCls = "text-[12.5px] font-bold text-ink-soft";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className={labelCls}>
        {label}
        {required && <span className="text-high"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={fieldCls}
      />
    </label>
  );
}

// Add/edit provider modal. Same reset-via-remount idiom as StockItemForm —
// the parent mounts this fresh per provider (or blank for "add"), which
// resets both the uncontrolled fields and the useActionState result.
export function ProviderForm({
  provider,
  onClose,
}: {
  provider: Provider | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveProvider, {});
  const wasPending = useRef(false);
  const editing = Boolean(provider);

  // Preferred/Approved is a segmented control, not a native input — its
  // value is tracked in state and mirrored to a hidden field for the action.
  const [preferred, setPreferred] = useState(provider?.pref ?? false);

  // Once a submit finishes without an error, the provider is saved — close.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onClose();
    }
    wasPending.current = pending;
  }, [pending, state.error, onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-deep/50 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-[560px] max-w-full overflow-y-auto rounded-[18px] border border-line-soft bg-cream"
      >
        <div className="flex items-start justify-between border-b border-line px-[26px] py-[22px]">
          <div>
            <h3 className="font-serif text-[24px] font-semibold text-ink">
              {editing ? "Edit provider" : "Add provider"}
            </h3>
            <p className="mt-[5px] text-[13.5px] text-ink-faint">Suppliers you order stock from.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-[26px] leading-none text-ink-faint"
          >
            ×
          </button>
        </div>

        <form action={action} className="flex flex-col gap-4 px-[26px] py-6">
          {provider && <input type="hidden" name="id" value={provider.id} />}
          <input type="hidden" name="preferred" value={preferred ? "true" : "false"} />

          <Field
            label="Supplier name"
            name="name"
            defaultValue={provider?.name}
            required
            placeholder="e.g. MedSupply NZ"
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-[6px]">
              <span className={labelCls}>Category</span>
              <select name="category" defaultValue={provider?.cat ?? CATEGORIES[0]} className={fieldCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-[6px]">
              <span className={labelCls}>Status</span>
              <div className="grid grid-cols-2 gap-[9px]">
                <button
                  type="button"
                  onClick={() => setPreferred(true)}
                  className={cn(
                    "rounded-[10px] py-[10px] text-[13.5px] font-semibold transition",
                    preferred ? "bg-navy text-cream" : "border border-line-soft bg-cream-2 text-ink-soft",
                  )}
                >
                  Preferred
                </button>
                <button
                  type="button"
                  onClick={() => setPreferred(false)}
                  className={cn(
                    "rounded-[10px] py-[10px] text-[13.5px] font-semibold transition",
                    !preferred ? "bg-navy text-cream" : "border border-line-soft bg-cream-2 text-ink-soft",
                  )}
                >
                  Approved
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Contact email"
              name="contact"
              type="email"
              defaultValue={provider?.contact}
              placeholder="orders@…"
            />
            <Field label="Phone" name="phone" defaultValue={provider?.phone} placeholder="09 …" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Lead time" name="lead" defaultValue={provider?.lead} placeholder="e.g. 2–3 days" />
            <Field label="Payment terms" name="terms" defaultValue={provider?.terms} placeholder="e.g. Net 30" />
          </div>

          {state.error && (
            <p role="alert" className="rounded-[10px] border border-high/30 bg-high-tint px-[13px] py-[10px] text-[13px] font-medium text-high">
              {state.error}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-[10px] border-t border-line pt-5">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-[11px] border border-line-soft bg-cream-2 px-[18px] py-[11px] text-[14px] font-semibold text-ink-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="cursor-pointer rounded-[11px] bg-navy px-5 py-[11px] text-[14px] font-semibold text-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving…" : editing ? "Save changes" : "Add provider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
