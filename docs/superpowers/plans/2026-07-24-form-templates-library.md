# Form Templates Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm module portal admin-only **Forms** — thư viện biểu mẫu trắng: admin upload/sửa/xoá/tải form template (file trong Supabase Storage), phân loại theo category enum, dùng chung toàn cơ sở.

**Architecture:** RSC page load `form_templates` từ Supabase → client `FormsView` (filter category + search + card). Admin CRUD qua server actions; file ở bucket private `form-templates`, tải qua signed URL. Bảng là anchor cho phase 2 (điền trực tiếp) — không xây gì cho phase 2 giờ.

**Tech Stack:** Next.js App Router (RSC + server actions, `useActionState`), Supabase Postgres + Storage, TypeScript, ESLint.

## Global Constraints

- No code before its doc — cập nhật docs cùng đợt (Task 7). Nguồn `docs/00-rules-and-conventions.md`.
- Không tham chiếu số phase/finding trong code/comment/tên migration — chỉ domain slug.
- Gate repo: `npx tsc --noEmit` sạch + `npx eslint <file>` sạch + `npx next build` thành công. Verify DB/storage do user chạy manual.
- **KHÔNG commit** (git rule user) — để working-tree edits.
- Building cố định `"wesley"` không áp cho forms (facility-wide, không cột building).
- Admin = `role_id ∈ {super_admin, admin}`. Mọi mutate action phải gate admin trước.
- File cho phép: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), ảnh (png/jpg/webp); size ≤ 10MB.
- Category enum (9, cố định): `Admission & discharge`, `Care plan`, `Clinical & assessment`, `Consent`, `Incident & risk`, `Medication`, `HR & staff`, `Policy & procedure`, `Other`.

---

### Task 1: Migration `0024` — bucket + RLS + bảng `form_templates`

**Files:**
- Create: `supabase/migrations/0024_form_templates.sql`

**Interfaces:**
- Produces: bucket `form-templates`; bảng `public.form_templates`; policies.

- [ ] **Step 1: Viết migration**

Tạo `supabase/migrations/0024_form_templates.sql`:

```sql
-- Forms library: blank form templates (PDF/Word/…) managed by admins, shared
-- facility-wide. Files live in a private Storage bucket; this table holds the
-- metadata. Anchor for a future "fillable forms" phase (form_fields / submissions).

-- Private bucket for the blank template files.
insert into storage.buckets (id, name, public)
values ('form-templates', 'form-templates', false)
on conflict (id) do nothing;

-- Authenticated users may read/write objects in this bucket; admin gating lives
-- in the server actions (same MVP pattern as the app's table policies).
create policy form_templates_obj_read on storage.objects
  for select to authenticated using (bucket_id = 'form-templates');
create policy form_templates_obj_write on storage.objects
  for insert to authenticated with check (bucket_id = 'form-templates');
create policy form_templates_obj_delete on storage.objects
  for delete to authenticated using (bucket_id = 'form-templates');

create table if not exists public.form_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null
               check (category in (
                 'Admission & discharge','Care plan','Clinical & assessment',
                 'Consent','Incident & risk','Medication','HR & staff',
                 'Policy & procedure','Other')),
  description  text,
  file_path    text not null,
  file_name    text not null,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid references public.app_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.form_templates enable row level security;
create policy form_templates_read on public.form_templates
  for select to authenticated using (true);
create policy form_templates_write on public.form_templates
  for all to authenticated using (true) with check (true);
```

- [ ] **Step 2: Kiểm cú pháp bằng mắt** — thứ tự bucket → object policies → table → RLS; enum 9 giá trị khớp Global Constraints. Không có gate SQL tự động (verify manual — Task 8).

---

### Task 2: Types + hằng category (`src/lib/forms-constants.ts` + `domain.ts`)

**Files:**
- Create: `src/lib/forms-constants.ts`
- Modify: `src/types/domain.ts` (`ModuleKey` union, ~line 292)

**Interfaces:**
- Produces: `FORM_CATEGORIES` (readonly array), `FormCategory` (union), `FormTemplate` (interface); `ModuleKey` có `"forms"`.

- [ ] **Step 1: Tạo `src/lib/forms-constants.ts`**

```typescript
// Fixed form-template categories (single source of truth for the enum). Changing
// this set also requires updating the check constraint in a new migration.
export const FORM_CATEGORIES = [
  "Admission & discharge",
  "Care plan",
  "Clinical & assessment",
  "Consent",
  "Incident & risk",
  "Medication",
  "HR & staff",
  "Policy & procedure",
  "Other",
] as const;

export type FormCategory = (typeof FORM_CATEGORIES)[number];

// One blank form template in the library. File itself lives in the
// `form-templates` Storage bucket at `filePath`.
export interface FormTemplate {
  id: string;
  name: string;
  category: FormCategory;
  description: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Thêm `"forms"` vào `ModuleKey`**

`src/types/domain.ts`, union `ModuleKey` — thêm `| "forms"` (đặt sau `"stock"` để nhóm cạnh các module vận hành):

```typescript
export type ModuleKey =
  | "dashboard"
  | "residents"
  | "rooms"
  | "roster"
  | "meals"
  | "activities"
  | "family"
  | "stock"
  | "forms"
  | "incidents"
  | "users";
```

- [ ] **Step 3: Type-check** — Run: `npx tsc --noEmit` → Expected: **fail** ở `mock-data/users.ts` (preset thiếu key `forms`). Sẽ fix ở Task 5. (Nếu muốn xanh ngay, làm Task 5 trước Task 3/4 — nhưng thứ tự này giữ mỗi task 1 deliverable.)

---

### Task 3: Data layer `src/lib/data/forms.ts`

**Files:**
- Create: `src/lib/data/forms.ts`

**Interfaces:**
- Consumes: `FormTemplate` (Task 2); bảng + bucket (Task 1).
- Produces: `getFormTemplates(): Promise<FormTemplate[]>`; `getFormDownloadUrl(filePath: string): Promise<string>`.

- [ ] **Step 1: Viết data readers**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { FormTemplate, FormCategory } from "@/lib/forms-constants";

const BUCKET = "form-templates";

export async function getFormTemplates(): Promise<FormTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("form_templates")
    .select("id,name,category,description,file_path,file_name,mime_type,size_bytes,uploaded_by,created_at,updated_at")
    .order("category")
    .order("name");
  if (error) throw new Error(`Failed to load form templates: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as FormCategory,
    description: r.description ?? "",
    filePath: r.file_path,
    fileName: r.file_name,
    mimeType: r.mime_type ?? "",
    sizeBytes: r.size_bytes != null ? Number(r.size_bytes) : 0,
    uploadedBy: r.uploaded_by ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

// Short-lived signed URL so an admin can open/download a private-bucket file.
export async function getFormDownloadUrl(filePath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60);
  if (error || !data) throw new Error(`Failed to sign download URL: ${error?.message}`);
  return data.signedUrl;
}
```

- [ ] **Step 2: Type-check file** — Run: `npx tsc --noEmit` (bỏ qua lỗi users.ts đã biết ở Task 2). File forms.ts không được có lỗi riêng.

---

### Task 4: Server actions `src/lib/actions/forms.ts`

**Files:**
- Create: `src/lib/actions/forms.ts`

**Interfaces:**
- Consumes: `getCurrentUser` (`@/lib/supabase/current-user`), `getFormDownloadUrl` (Task 3), `FORM_CATEGORIES`/`FormCategory` (Task 2).
- Produces: `saveFormTemplate(_prev, fd)`, `deleteFormTemplate(fd)`, `formDownloadUrl(_prev, fd)`; type `FormActionState`.

- [ ] **Step 1: Viết actions**

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getFormDownloadUrl } from "@/lib/data/forms";
import { FORM_CATEGORIES, type FormCategory } from "@/lib/forms-constants";

const BUCKET = "form-templates";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png", "image/jpeg", "image/webp",
]);

export interface FormActionState { error?: string }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// Admin guard — mirrors requireAdmin (users.ts) with a forms-specific message.
async function requireFormsAdmin(): Promise<FormActionState | null> {
  const me = await getCurrentUser();
  const role = me?.appUser?.role_id;
  if (role !== "super_admin" && role !== "admin") return { error: "Bạn không có quyền quản lý biểu mẫu." };
  return null;
}

export async function saveFormTemplate(_prev: FormActionState, fd: FormData): Promise<FormActionState> {
  const denied = await requireFormsAdmin();
  if (denied) return denied;

  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Tên biểu mẫu là bắt buộc." };
  const category = str(fd, "category") as FormCategory;
  if (!FORM_CATEGORIES.includes(category)) return { error: "Chọn một phân loại hợp lệ." };
  const description = str(fd, "description");

  const file = fd.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!id && !hasFile) return { error: "Chọn một file để tải lên." };
  if (hasFile) {
    if (file.size > MAX_SIZE) return { error: "File vượt quá 10 MB." };
    if (!ALLOWED.has(file.type)) return { error: "Định dạng file không được hỗ trợ." };
  }

  const supabase = await createClient();
  const me = await getCurrentUser();

  // Upload the new file first (so a failed upload never orphans the row).
  let newPath: string | null = null;
  let newName = "";
  if (hasFile) {
    const f = file as File;
    newPath = `${randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_")}`;
    newName = f.name;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(newPath, f, {
      contentType: f.type,
      upsert: false,
    });
    if (upErr) return { error: `Tải file thất bại: ${upErr.message}` };
  }

  if (id) {
    // Edit: fetch the old path so we can swap the file if a new one was chosen.
    const { data: existing } = await supabase
      .from("form_templates").select("file_path").eq("id", id).maybeSingle();
    const update: Record<string, unknown> = { name, category, description: description || null, updated_at: new Date().toISOString() };
    if (newPath) { update.file_path = newPath; update.file_name = newName; update.mime_type = (file as File).type; update.size_bytes = (file as File).size; }
    const { error } = await supabase.from("form_templates").update(update).eq("id", id);
    if (error) { if (newPath) await supabase.storage.from(BUCKET).remove([newPath]); return { error: error.message }; }
    if (newPath && existing?.file_path) await supabase.storage.from(BUCKET).remove([existing.file_path]);
  } else {
    const f = file as File;
    const { error } = await supabase.from("form_templates").insert({
      name, category, description: description || null,
      file_path: newPath, file_name: newName, mime_type: f.type, size_bytes: f.size,
      uploaded_by: me?.appUser?.id ?? null,
    });
    if (error) { if (newPath) await supabase.storage.from(BUCKET).remove([newPath]); return { error: error.message }; }
  }

  revalidatePath("/portal/forms");
  return {};
}

export async function deleteFormTemplate(fd: FormData): Promise<void> {
  const denied = await requireFormsAdmin();
  if (denied) throw new Error(denied.error);
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("form_templates").select("file_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("form_templates").delete().eq("id", id);
  if (error) throw new Error(`Xoá biểu mẫu thất bại: ${error.message}`);
  if (row?.file_path) await supabase.storage.from(BUCKET).remove([row.file_path]);
  revalidatePath("/portal/forms");
}

// Returns a fresh signed URL for the client to open in a new tab.
export async function formDownloadUrl(
  _prev: { url?: string; error?: string },
  fd: FormData,
): Promise<{ url?: string; error?: string }> {
  const denied = await requireFormsAdmin();
  if (denied) return { error: denied.error };
  const filePath = str(fd, "filePath");
  if (!filePath) return { error: "Thiếu đường dẫn file." };
  try {
    return { url: await getFormDownloadUrl(filePath) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không tạo được link tải." };
  }
}
```

- [ ] **Step 2: Type-check + lint** — Run: `npx eslint src/lib/actions/forms.ts src/lib/data/forms.ts src/lib/forms-constants.ts` → Expected: sạch.

---

### Task 5: Nav + module + permission preset + icon

**Files:**
- Modify: `src/components/shared/icons.tsx` (thêm `forms` glyph)
- Modify: `src/lib/portal-nav.ts` (`PORTAL_ADMIN_NAV`)
- Modify: `src/lib/mock-data/users.ts` (`modules` + `preset`)

**Interfaces:**
- Consumes: `ModuleKey` có `"forms"` (Task 2).
- Produces: nav item `/portal/forms`; module `forms` trong permission matrix.

- [ ] **Step 1: Thêm icon `forms`**

`src/components/shared/icons.tsx` — trong object `PATHS`, thêm 1 entry (glyph tài liệu, dùng viewBox 24 như các icon khác):

```typescript
  forms: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
```

- [ ] **Step 2: Nav item (admin group)**

`src/lib/portal-nav.ts` — thêm vào `PORTAL_ADMIN_NAV` (sau `incidents`):

```typescript
  { href: "/portal/forms", label: "Forms", icon: "forms" },
```

- [ ] **Step 3: Module list + preset**

`src/lib/mock-data/users.ts` — thêm vào `modules` (sau `stock`):

```typescript
  { key: "forms", label: "Forms" },
```

Trong `preset`, thêm key `forms` cho **mọi** role (admin ALL; các role khác NONE):

```typescript
  admin: { …, stock: ALL, forms: ALL, incidents: ALL, users: ALL },
  nurse: { …, stock: p(1,0,0,0), forms: NONE, incidents: p(1,1,1,0), users: NONE },
  carer: { …, stock: NONE, forms: NONE, incidents: p(1,1,0,0), users: NONE },
  activities: { …, stock: p(1,0,0,0), forms: NONE, incidents: p(1,0,0,0), users: NONE },
  family: { …, stock: NONE, forms: NONE, incidents: NONE, users: NONE },
  stock_manager: { …, stock: ALL, forms: NONE, incidents: NONE, users: NONE },
```

(super_admin nhận ALL tự động qua `getDefaultPermissions`.)

- [ ] **Step 4: Type-check** — Run: `npx tsc --noEmit` → Expected: sạch (preset đủ key `forms` cho mọi role → hết lỗi từ Task 2).

---

### Task 6: UI — page + view + modal

**Files:**
- Create: `src/app/portal/forms/page.tsx`
- Create: `src/components/portal/forms/forms-view.tsx`
- Create: `src/components/portal/forms/form-template-modal.tsx`

**Interfaces:**
- Consumes: `getFormTemplates` (Task 3); `saveFormTemplate`/`deleteFormTemplate`/`formDownloadUrl` (Task 4); `FORM_CATEGORIES`/`FormTemplate` (Task 2); `usePortalRole` (`@/lib/role-context`).

- [ ] **Step 1: RSC page**

`src/app/portal/forms/page.tsx`:

```tsx
import { getFormTemplates } from "@/lib/data/forms";
import { FormsView } from "@/components/portal/forms/forms-view";

// Admin-only forms library: blank form templates grouped by category.
export default async function FormsPage() {
  const templates = await getFormTemplates();
  return <FormsView templates={templates} />;
}
```

- [ ] **Step 2: Modal**

`src/components/portal/forms/form-template-modal.tsx`:

```tsx
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
```

- [ ] **Step 3: View**

`src/components/portal/forms/forms-view.tsx`:

```tsx
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
```

- [ ] **Step 4: Gate build** — Run: `npx tsc --noEmit && npx eslint src/app/portal/forms/page.tsx src/components/portal/forms/forms-view.tsx src/components/portal/forms/form-template-modal.tsx && npx next build` → Expected: tất cả sạch, route `/portal/forms` xuất hiện trong build output.

> Nếu `usePortalRole`/`role-context` export tên khác, hoặc `Icon`/`cn`/token màu (`text-high`, `bg-navy`, `border-input`…) khác — kiểm file tương ứng và chỉnh cho khớp trước khi build. Đây là các lớp dùng chung toàn app.

---

### Task 7: Docs — No code before its doc

**Files:**
- Create: `docs/features/portal/forms-library.md`
- Modify: `docs/03-data-model.md`
- Modify: `docs/screen-registry.md` (nếu tồn tại)

- [ ] **Step 1: `forms-library.md`** — mô tả: mục đích (thư viện biểu mẫu, phase 1 = file), admin-only (admin nav), data flow (RSC `getFormTemplates` → `FormsView`; actions `saveFormTemplate`/`deleteFormTemplate`/`formDownloadUrl`), storage (bucket private `form-templates`, signed URL 60s), category enum 9 loại, RBAC (module `forms`, admin ALL còn lại NONE), phase-2 hook (form_fields/submissions). Migration `0024`.

- [ ] **Step 2: `03-data-model.md`** — thêm mục bảng `form_templates` (các cột) + bucket `form-templates`, migration `0024_form_templates.sql`.

- [ ] **Step 3: `screen-registry.md`** — nếu file tồn tại, thêm dòng `/portal/forms` (admin-only, module forms). Nếu không có file, bỏ qua.

---

### Task 8: Master plan + bàn giao verify

**Files:**
- Modify: `plans/20260720-master-plan-victoria-mt-eden.md`

- [ ] **Step 1: Thêm luồng mới vào master plan**

- Bảng tổng quan: thêm dòng luồng (vd `M | Forms — thư viện biểu mẫu | ✅ done code (verify manual)`) link spec + plan.
- Mục open items "Luồng M — Forms (bạn chạy manual)":
  - [ ] Apply `supabase/migrations/0024_form_templates.sql` (tạo bảng + bucket + RLS).
  - [ ] Re-run `scripts/db/seed-core-schema.mts` (seed `role_permissions` cho module `forms`).
  - [ ] `/portal/forms` (admin): Add form → upload PDF → list; Download mở đúng; Edit đổi field + thay file; Delete gỡ row + object.
  - [ ] Login role non-admin → không thấy menu Forms.
- Track log: dòng 2026-07-24 mô tả Forms code xong (scope, files, migration 0024).

- [ ] **Step 2: Gate cuối** — Run: `npx tsc --noEmit && npx eslint . && npx next build` → Expected: sạch.

- [ ] **Step 3: Bàn giao** — liệt kê việc manual (apply 0024 + re-seed + test). Không commit.

---

## Ghi chú thực thi

- Thứ tự: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Task 2 để `tsc` đỏ tạm (thiếu key preset) đến khi Task 5 xong — chấp nhận được vì mỗi task 1 deliverable; gate xanh thật ở Task 5/6.
- Không có unit-test harness cho luồng này; "test" = `tsc`/eslint/`next build` sạch + verify DB/storage manual (user), nhất quán các luồng trước.
- Token màu/spacing dùng lại lớp Tailwind hiện có của app (tham chiếu 1 view mẫu như `stock`/`users` nếu nghi ngờ tên token).
