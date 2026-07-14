"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveResident, deleteResident } from "@/lib/actions/residents";
import type { Resident } from "@/types/domain";

const WINGS = ["Rātā", "Kōwhai", "Tōtara"] as const;
const CARE_TYPES = ["Rest Home", "Hospital", "Dementia", "Respite"] as const;

const fieldCls =
  "rounded-[11px] border border-input bg-cream-2 px-[14px] py-[10px] text-[15px] text-ink outline-none focus:border-navy";
const labelCls = "text-[13px] font-semibold text-ink-soft";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "text" | "numeric";
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
        inputMode={inputMode}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={fieldCls}
      />
    </label>
  );
}

export function ResidentForm({ resident }: { resident?: Resident }) {
  const [state, action, pending] = useActionState(saveResident, {});
  const editing = Boolean(resident);

  return (
    <div className="mt-[22px] max-w-[720px]">
      <form action={action} className="flex flex-col gap-4">
        {resident && <input type="hidden" name="slug" value={resident.slug} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" name="name" defaultValue={resident?.name} required placeholder="e.g. Margaret Whitcombe" />
          <Field label="Preferred name" name="pref" defaultValue={resident?.pref} placeholder="e.g. Peggy" />

          <label className="flex flex-col gap-[6px]">
            <span className={labelCls}>Wing <span className="text-high">*</span></span>
            <select name="wing" defaultValue={resident?.wing ?? ""} required className={fieldCls}>
              <option value="" disabled>Choose a wing…</option>
              {WINGS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className={labelCls}>Care type <span className="text-high">*</span></span>
            <select name="careType" defaultValue={resident?.careType ?? ""} required className={fieldCls}>
              <option value="" disabled>Choose a care type…</option>
              {CARE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <Field label="Room" name="room" defaultValue={resident?.room} placeholder="e.g. 12" />
          <Field label="Age" name="age" type="number" inputMode="numeric" defaultValue={resident?.age || undefined} placeholder="e.g. 84" />
          <Field label="Diet" name="diet" defaultValue={resident?.diet} placeholder="e.g. Soft, no nuts" />
          <Field label="Mobility" name="mobility" defaultValue={resident?.mobility} placeholder="e.g. Walking frame" />
          <Field label="GP" name="gp" defaultValue={resident?.gp} placeholder="e.g. Dr Anaru" />
          <Field label="Care flags" name="flags" defaultValue={resident?.flags.join(", ")} placeholder="Comma-separated, e.g. Falls watch, Diabetic" />
        </div>

        <label className="flex flex-col gap-[6px]">
          <span className={labelCls}>About / notes</span>
          <textarea
            name="note"
            defaultValue={resident?.note}
            rows={4}
            placeholder="A short profile — interests, routines, family…"
            className={fieldCls + " resize-y"}
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-[10px] border border-high/30 bg-high-tint px-[13px] py-[10px] text-[13px] font-medium text-high">
            {state.error}
          </p>
        )}

        <div className="mt-1 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-[11px] bg-navy px-5 py-[12px] text-[15px] font-semibold text-cream transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : editing ? "Save changes" : "Admit resident"}
          </button>
          <Link
            href={editing ? `/portal/residents/${resident!.slug}` : "/portal/residents"}
            className="rounded-[11px] border border-line-strong px-5 py-[12px] text-[15px] font-semibold text-navy hover:bg-cream-2"
          >
            Cancel
          </Link>
        </div>
      </form>

      {editing && (
        <form
          action={deleteResident}
          onSubmit={(e) => {
            if (!confirm(`Remove ${resident!.name} from the directory? This cannot be undone.`)) {
              e.preventDefault();
            }
          }}
          className="mt-8 border-t border-line pt-5"
        >
          <input type="hidden" name="slug" value={resident!.slug} />
          <button type="submit" className="text-[13.5px] font-semibold text-high hover:underline">
            Remove resident
          </button>
        </form>
      )}
    </div>
  );
}
