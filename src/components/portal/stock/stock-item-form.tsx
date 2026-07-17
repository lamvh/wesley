"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveProduct } from "@/lib/actions/stock";
import type { Product, Provider } from "@/types/domain";

const CATEGORIES = [
  "Clinical & PPE",
  "Continence",
  "Housekeeping",
  "Kitchen & Nutrition",
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
  min,
  step,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  min?: string;
  step?: string;
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
        min={min}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={fieldCls}
      />
    </label>
  );
}

// Add/edit item modal. The parent conditionally mounts this component (no
// internal `open` flag needed - mounting fresh each time resets both the
// form's default values and the useActionState result for the new item).
export function StockItemForm({
  product,
  providers,
  onClose,
}: {
  product: Product | null;
  providers: Provider[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveProduct, {});
  const wasPending = useRef(false);
  const editing = Boolean(product);

  // Once a submit finishes without an error, the item is saved - close.
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
          <h3 className="font-serif text-[24px] font-semibold text-ink">
            {editing ? "Edit item" : "Add item"}
          </h3>
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
          {product && <input type="hidden" name="id" value={product.id} />}

          <Field
            label="Item name"
            name="name"
            defaultValue={product?.name}
            required
            placeholder="e.g. Nitrile gloves (M)"
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-[6px]">
              <span className={labelCls}>Category</span>
              <select name="category" defaultValue={product?.cat ?? CATEGORIES[0]} className={fieldCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <Field label="Unit" name="unit" defaultValue={product?.unit} placeholder="boxes, packs…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="On hand" name="qty" type="number" min="0" defaultValue={product?.qtyNow ?? 0} />
            <Field label="Par level" name="par" type="number" min="0" defaultValue={product?.par ?? 0} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-[6px]">
              <span className={labelCls}>Provider</span>
              <select name="provider" defaultValue={product?.prov ?? ""} className={fieldCls}>
                <option value="">No preferred provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <Field
              label="Unit price ($)"
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product?.price}
              placeholder="0.00"
            />
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
              {pending ? "Saving…" : editing ? "Save changes" : "Add item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
