"use client";

import { useState } from "react";
import { Icon } from "@/components/shared/icons";

// Shared destructive-confirm modal (item, provider, movement, user…). The
// parent owns `open`/`label`/`onConfirm`; this only renders the ask and
// disables its buttons while `onConfirm` is in flight.
export function ConfirmDeleteModal({
  open,
  label,
  body,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  label: string;
  body?: string;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  if (!open) return null;

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[210] flex items-center justify-center bg-navy-deep/50 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[400px] max-w-full rounded-[18px] border border-line-soft bg-cream p-[26px]"
      >
        <div className="mb-[14px] flex size-[46px] items-center justify-center rounded-xl bg-rust-tint text-rust">
          <Icon name="trash" size={20} />
        </div>
        <h3 className="font-serif text-[22px] font-semibold text-ink">Remove {label}?</h3>
        {body && <p className="mt-2 text-[14px] leading-[1.5] text-ink-muted">{body}</p>}
        {error && <p className="text-rust text-[13px] mt-2">{error}</p>}
        <div className="mt-[22px] flex justify-end gap-[10px]">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="cursor-pointer rounded-[11px] border border-line-soft bg-cream-2 px-[18px] py-[11px] text-[14px] font-semibold text-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="cursor-pointer rounded-[11px] bg-rust px-5 py-[11px] text-[14px] font-semibold text-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
