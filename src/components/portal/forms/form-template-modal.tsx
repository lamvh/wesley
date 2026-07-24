"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveFormTemplate } from "@/lib/actions/forms";
import { FORM_CATEGORIES, type FormTemplate } from "@/lib/forms-constants";

const FIELD =
  "w-full rounded-[11px] border border-input bg-cream-2 px-[14px] py-[10px] text-[14.5px] text-ink outline-none focus:border-navy";
const LABEL = "mb-[7px] block text-[12.5px] font-bold text-ink-soft";

export function FormTemplateModal({
  template,
  onClose,
}: {
  template: FormTemplate | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveFormTemplate, {} as { error?: string });
  const wasPending = useRef(false);
  const editing = Boolean(template);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onClose();
    wasPending.current = pending;
  }, [pending, state, onClose]);

  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-deep/50 p-6 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-[540px] max-w-full overflow-y-auto rounded-[18px] border border-line-soft bg-cream">
        <div className="flex items-start justify-between border-b border-line px-[26px] py-[22px]">
          <h3 className="font-serif text-[24px] font-semibold text-ink">{editing ? "Edit form" : "Add a form"}</h3>
          <button onClick={onClose} className="cursor-pointer text-[26px] leading-none text-ink-faint">×</button>
        </div>
        <form action={action} className="flex flex-col gap-4 px-[26px] py-6">
          {template && <input type="hidden" name="id" value={template.id} />}
          <label>
            <span className={LABEL}>Form name *</span>
            <input name="name" defaultValue={template?.name} required placeholder="e.g. Resident admission form" className={FIELD} />
          </label>
          <label>
            <span className={LABEL}>Category *</span>
            <select name="category" defaultValue={template?.category ?? FORM_CATEGORIES[0]} className={FIELD}>
              {FORM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            <span className={LABEL}>Description</span>
            <textarea name="description" defaultValue={template?.description} rows={3} className={FIELD} />
          </label>
          <label>
            <span className={LABEL}>{editing ? "Replace file (optional)" : "File *"}</span>
            <input type="file" name="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" className={FIELD} />
            {editing && <span className="mt-1 block text-[12px] text-ink-faint">Hiện tại: {template?.fileName}. Bỏ trống để giữ file cũ.</span>}
          </label>
          {state.error && <p className="text-[13px] text-high">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-[11px] px-4 py-2 text-[14px] font-semibold text-ink-muted">Cancel</button>
            <button type="submit" disabled={pending} className="rounded-[11px] bg-navy px-5 py-2 text-[14px] font-semibold text-cream disabled:opacity-60">
              {pending ? "Saving…" : editing ? "Save changes" : "Add form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
