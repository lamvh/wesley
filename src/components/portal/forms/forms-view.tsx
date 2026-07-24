"use client";

import { useMemo, useState } from "react";
import { usePortalRole } from "@/lib/role-context";
import { Icon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { FORM_CATEGORIES, type FormCategory, type FormTemplate } from "@/lib/forms-constants";
import { deleteFormTemplate, formDownloadUrl } from "@/lib/actions/forms";
import { FormTemplateModal } from "@/components/portal/forms/form-template-modal";

function fmtSize(bytes: number): string {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export function FormsView({ templates }: { templates: FormTemplate[] }) {
  const { role } = usePortalRole();
  const isAdmin = role === "admin";
  const [filter, setFilter] = useState<"All" | FormCategory>("All");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FormTemplate | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter(
      (t) =>
        (filter === "All" || t.category === filter) &&
        (!q || t.name.toLowerCase().includes(q)),
    );
  }, [templates, filter, query]);

  async function download(t: FormTemplate) {
    const fd = new FormData();
    fd.set("filePath", t.filePath);
    const res = await formDownloadUrl({}, fd);
    if (res.url) window.open(res.url, "_blank");
    else alert(res.error ?? "Không tải được file.");
  }

  async function remove(t: FormTemplate) {
    if (!confirm(`Xoá biểu mẫu "${t.name}"?`)) return;
    const fd = new FormData();
    fd.set("id", t.id);
    await deleteFormTemplate(fd);
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">Forms</h1>
          <p className="text-[13.5px] text-ink-muted">Thư viện biểu mẫu Wesley — tải file trắng để in/điền.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="rounded-[11px] bg-navy px-4 py-2 text-[14px] font-semibold text-cream"
          >
            + Add form
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-full border border-field bg-cream-3 p-1">
          {(["All", ...FORM_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-full px-[13px] py-1.5 text-[13px] font-semibold",
                filter === c ? "bg-navy text-cream" : "text-ink-muted",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên…"
          className="rounded-[11px] border border-input bg-cream-2 px-[14px] py-[9px] text-[14px] outline-none focus:border-navy"
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-[14px] border border-line-soft bg-cream-2 p-8 text-center text-[14px] text-ink-muted">
          Chưa có biểu mẫu nào{filter !== "All" ? ` trong "${filter}"` : ""}.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <div key={t.id} className="flex flex-col gap-2 rounded-[14px] border border-line-soft bg-cream p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-cream-3 px-2.5 py-1 text-[11.5px] font-semibold text-ink-soft">{t.category}</span>
                <Icon name="forms" size={18} className="text-ink-faint" />
              </div>
              <div className="text-[15px] font-semibold text-ink">{t.name}</div>
              {t.description && <div className="text-[13px] text-ink-muted line-clamp-2">{t.description}</div>}
              <div className="text-[12px] text-ink-faint">{t.fileName}{t.sizeBytes ? ` · ${fmtSize(t.sizeBytes)}` : ""}</div>
              <div className="mt-1 flex gap-2">
                <button onClick={() => download(t)} className="rounded-[10px] bg-navy px-3 py-1.5 text-[13px] font-semibold text-cream">Download</button>
                {isAdmin && (
                  <>
                    <button onClick={() => { setEditing(t); setModalOpen(true); }} className="rounded-[10px] border border-line px-3 py-1.5 text-[13px] font-semibold text-ink-muted">Edit</button>
                    <button onClick={() => remove(t)} className="rounded-[10px] border border-line px-3 py-1.5 text-[13px] font-semibold text-high">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <FormTemplateModal template={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
