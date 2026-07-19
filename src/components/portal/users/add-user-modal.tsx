"use client";

import { ROLE_KEYS } from "@/lib/mock-data";
import { userRoleMeta } from "@/lib/design-meta";
import type { UserRole } from "@/types/domain";
import { cn } from "@/lib/utils";

export interface AddUserForm {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  scope: string;
}

const FIELD =
  "w-full rounded-[11px] border border-line-soft bg-cream-2 px-[14px] py-[11px] text-[14.5px] text-ink outline-none placeholder:text-ink-faint";
const LABEL = "mb-[7px] block text-[12.5px] font-bold text-ink-soft";

// Add / edit user modal. Controlled by the parent, which owns the form and
// whether we're editing (flips the title + CTA); submit mutates the parent's
// local user list.
export function AddUserModal({
  form,
  editing = false,
  error = null,
  submitting = false,
  onChange,
  onClose,
  onSubmit,
}: {
  form: AddUserForm;
  editing?: boolean;
  error?: string | null;
  submitting?: boolean;
  onChange: (patch: Partial<AddUserForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-deep/50 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-[540px] max-w-full overflow-y-auto rounded-[18px] border border-line-soft bg-cream"
      >
        <div className="flex items-start justify-between border-b border-line px-[26px] py-[22px]">
          <div>
            <h3 className="font-serif text-[24px] font-semibold">
              {editing ? "Edit user" : "Add a user"}
            </h3>
            <p className="mt-[5px] text-[13.5px] text-ink-muted">
              Username bắt buộc. Email tùy chọn. Bạn đặt mật khẩu cho họ.
            </p>
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

        <div className="flex flex-col gap-[18px] px-[26px] py-6">
          <div>
            <label className={LABEL}>Full name</label>
            <input
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Anahera Wiremu"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Username</label>
            <input
              value={form.username}
              onChange={(e) => onChange({ username: e.target.value })}
              placeholder="vd. anahera.w"
              autoCapitalize="none"
              autoCorrect="off"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>
              Email <span className="font-normal text-ink-faint">(tùy chọn)</span>
            </label>
            <input
              value={form.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="name@wesley.nz"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Mật khẩu</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => onChange({ password: e.target.value })}
              placeholder="Tối thiểu 8 ký tự"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Role</label>
            <div className="grid grid-cols-2 gap-[9px]">
              {ROLE_KEYS.map((r) => {
                const meta = userRoleMeta[r];
                const on = form.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChange({ role: r })}
                    className={cn(
                      "rounded-[11px] border-[1.5px] px-3 py-[10px] text-left text-[13px] font-semibold transition-colors",
                      on
                        ? cn(
                            meta.badge.split(" ")[0],
                            meta.dot.replace("bg-", "border-"),
                            meta.text,
                          )
                        : "border-line-soft bg-cream-2 text-ink-soft",
                    )}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={LABEL}>
              Scope / wing{" "}
              <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <input
              value={form.scope}
              onChange={(e) => onChange({ scope: e.target.value })}
              placeholder="e.g. Rātā wing, or a resident for family"
              className={FIELD}
            />
          </div>
        </div>

        {error && (
          <div className="px-[26px] pb-2 text-[13px] font-medium text-high">{error}</div>
        )}
        <div className="flex justify-end gap-[10px] border-t border-line px-[26px] py-[18px]">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[11px] border border-line-soft bg-cream-2 px-[18px] py-[11px] text-[14px] font-semibold text-ink-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="cursor-pointer rounded-[11px] bg-navy px-5 py-[11px] text-[14px] font-semibold text-cream disabled:opacity-50"
          >
            {editing ? "Save changes" : submitting ? "Đang tạo…" : "Tạo tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}
