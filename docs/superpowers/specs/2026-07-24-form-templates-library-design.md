# Module Forms — thư viện biểu mẫu (design)

Ngày: 2026-07-24 · Trạng thái: spec (chưa code)

## Mục tiêu

Thêm module portal **Forms** — thư viện biểu mẫu trắng (blank form templates) của Wesley.
Giai đoạn 1 (spec này): **thư viện file** — admin upload/sửa/xoá form template (file PDF/Word…),
mọi form dùng chung toàn cơ sở; admin duyệt + tải/in. Thiết kế chừa đường cho giai đoạn 2
(**điền trực tiếp**) mà không phải làm lại: bảng `form_templates` là anchor để sau này gắn
`form_fields` / `form_submissions`.

## Scope (chốt qua brainstorm)

| Quyết định | Chốt |
|---|---|
| Bản chất | Giai đoạn 1 = thư viện file (upload/tải). Giai đoạn 2 (sau) = điền trực tiếp |
| Lưu file | **Supabase Storage** — bucket private `form-templates` + metadata ở DB |
| Category | **Enum cố định** (9 loại, xem dưới) — đổi = sửa enum + migration |
| Phạm vi | **Chung toàn cơ sở** (không tách Wesley/Lodge) |
| Truy cập | **Admin-only** — nav trong nhóm Administration; admin/super_admin quản lý, role khác không thấy |

> Lưu ý đảo ngược có chủ đích: ý ban đầu "mọi staff xem/tải" đã đổi thành **admin-only** (đặt ở
> admin nav). Sau muốn mở cho staff: chuyển nav item sang main nav + cấp quyền `view` cho role đó.

## Category enum (cố định)

`Admission & discharge` · `Care plan` · `Clinical & assessment` · `Consent` ·
`Incident & risk` · `Medication` · `HR & staff` · `Policy & procedure` · `Other`

(Bộ mặc định — chưa nhận danh sách riêng từ user; đổi sau = sửa `FormCategory` union +
check constraint trong migration mới.)

## Data model — migration `0024_form_templates.sql`

1. **Bucket** private `form-templates`:
   ```sql
   insert into storage.buckets (id, name, public)
   values ('form-templates', 'form-templates', false)
   on conflict (id) do nothing;
   ```
2. **RLS trên `storage.objects`** cho bucket này: authenticated read + write (admin siết ở
   server action). Policies scope `bucket_id = 'form-templates'`.
3. **Bảng `public.form_templates`**:
   - `id uuid pk default gen_random_uuid()`
   - `name text not null`
   - `category text not null` + `check (category in (…9 giá trị…))`
   - `description text`
   - `file_path text not null` — object path trong bucket
   - `file_name text not null` — tên gốc để đặt khi tải
   - `mime_type text`, `size_bytes bigint`
   - `uploaded_by uuid references app_users(id) on delete set null`
   - `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`
4. **RLS bảng**: authenticated read; authenticated write (pattern MVP hiện có — admin-gate ở action).

## Types (`types/domain.ts`)

- `FormCategory` union (9 giá trị enum).
- `FormTemplate` interface: `{ id, name, category: FormCategory, description, filePath,
  fileName, mimeType, sizeBytes, uploadedBy, createdAt, updatedAt }`.
- `ModuleKey += "forms"`.

## Data (`lib/data/forms.ts`)

- `getFormTemplates(): Promise<FormTemplate[]>` — select, order by `category` then `name`.
- `getFormDownloadUrl(filePath: string): Promise<string>` — `storage.from("form-templates")
  .createSignedUrl(filePath, 60)` → URL (60s). Dùng ở server action tải.

## Actions (`lib/actions/forms.ts`)

- `FormActionState = { error?: string }`.
- Guard admin: kiểm `getCurrentUser().appUser.role_id ∈ {super_admin, admin}` (mirror
  `requireAdmin`, message riêng cho forms).
- `saveFormTemplate(_prev, fd): Promise<FormActionState>` — tạo/sửa:
  - Đọc `id, name, category, description`, file `fd.get("file") as File`.
  - Validate: name bắt buộc, category ∈ enum. File **bắt buộc khi tạo**, optional khi sửa
    (không chọn file mới → giữ file cũ). Validate mime/đuôi (PDF, Word, Excel, ảnh) + size ≤ 10MB.
  - Nếu có file: upload lên bucket path `${crypto.randomUUID()}-${sanitized name}`;
    khi sửa và thay file → xoá object cũ sau khi upload mới thành công.
  - Upsert row (`updated_at = now()` khi sửa), `uploaded_by = me.appUser.id` khi tạo.
  - `revalidatePath("/portal/forms")`.
- `deleteFormTemplate(fd): Promise<void>` — admin-gate; xoá `storage.objects` (file_path) rồi
  xoá row; `revalidatePath`.
- `formDownloadUrl(fd): Promise<{ url?: string; error?: string }>` — admin-gate; trả signed URL
  cho client mở tab mới.

## UI

- **Route** `src/app/portal/forms/page.tsx` (RSC) — `getFormTemplates()` → `<FormsView>`.
- **`forms-view.tsx`** (client): 
  - Header + nút "Add form" (admin).
  - Filter pills theo category (All + 9 loại) + ô search theo name.
  - Danh sách card nhóm theo category: mỗi card hiện name, category badge, description,
    file_name + size; nút **Download** (mọi người vào được) + **Edit**/**Delete** (admin).
  - Dùng `usePortalRole()` để ẩn/hiện control admin (phòng thủ; nav đã admin-only).
- **`form-template-modal.tsx`** (client): field name, category `<select>`, description
  `<textarea>`, `<input type="file">` (bắt buộc khi tạo, "giữ file hiện tại" khi sửa). Submit
  qua `saveFormTemplate` (server action, `useActionState`).
- **Download**: click → gọi `formDownloadUrl` → `window.open(url)`.

## Nav + quyền

- **Icon**: thêm `forms` vào `icons.tsx` (glyph tài liệu).
- **Nav**: thêm `{ href:"/portal/forms", label:"Forms", icon:"forms" }` vào **`PORTAL_ADMIN_NAV`**
  (`portal-nav.ts`).
- **Module + permission**: `modules += { key:"forms", label:"Forms" }`; `preset` mỗi role thêm
  `forms`: admin `ALL`, super_admin `ALL` (auto), **các role khác `NONE`**.
- **Manual (sau apply)**: re-run `scripts/db/seed-core-schema.mts` để seed `role_permissions`
  cho module mới (giống luồng G-v2).

## Giai đoạn 2 (chỉ ghi chú, KHÔNG code giờ)

`form_templates.id` là anchor. Sau này: `form_fields(form_template_id, ...)` +
`form_submissions(form_template_id, filled_by, data jsonb, ...)`. Không cần thêm gì ở phase 1.

## Docs cần cập nhật (No code before its doc)

- Mới: `docs/features/portal/forms-library.md` (mô tả module, data flow, RBAC, storage).
- `docs/03-data-model.md` — bảng `form_templates` + bucket.
- `docs/screen-registry.md` (nếu có) — thêm `/portal/forms`.
- Master plan — thêm luồng mới + open items verify manual.

## Verify (bạn chạy manual)

- Apply `0024_form_templates.sql` (tạo bảng + bucket + RLS).
- Re-run `scripts/db/seed-core-schema.mts` (role_permissions cho `forms`).
- `/portal/forms` (admin): Add form → upload PDF → thấy trong list; Download mở đúng file;
  Edit đổi name/category + thay file; Delete gỡ cả row + object.
- Đăng nhập role non-admin: **không thấy** menu Forms.

## Câu hỏi chưa giải quyết

1. Bộ category: đang dùng mặc định 9 loại — nếu Wesley có bộ chuẩn riêng, đưa sau (sửa enum).
2. Giới hạn loại file/size (đang đề xuất PDF/Word/Excel/ảnh, ≤10MB) — chốt lại nếu cần khác.
