# Forms library (`/portal/forms`)

Admin-only module: thư viện biểu mẫu trắng (blank form templates) của Wesley, dùng chung toàn
cơ sở. **Giai đoạn 1** (hiện tại): thư viện file — admin upload/sửa/xoá/tải. **Giai đoạn 2**
(sau): điền trực tiếp — bảng `form_templates` là anchor để gắn `form_fields`/`form_submissions`.

## Truy cập (RBAC)

- Nav: nhóm **Administration** (`PORTAL_ADMIN_NAV`, `portal-nav.ts`) → chỉ admin thấy menu.
- Module `forms` (permission matrix): **admin/super_admin = ALL**, các role khác **NONE**.
- Server actions gate admin (`role_id ∈ {super_admin, admin}`) trước mọi mutate — bảo vệ kể cả
  khi ai đó gọi thẳng action.
- Mở cho staff sau này: chuyển nav item sang `PORTAL_NAV` + cấp `view` cho role trong `preset`.

## Data flow

- **RSC page** `src/app/portal/forms/page.tsx` → `getFormTemplates()` (`lib/data/forms.ts`) →
  `<FormsView>`.
- **View** `src/components/portal/forms/forms-view.tsx` (client): filter pills theo category +
  search theo name; card nhóm hiển thị category badge, name, description, file_name + size;
  nút Download + (admin) Edit/Delete. `usePortalRole()` ẩn/hiện control admin.
- **Modal** `form-template-modal.tsx`: name, category `<select>`, description, `<input type=file>`
  (bắt buộc khi tạo, optional khi sửa — bỏ trống giữ file cũ). Submit qua `saveFormTemplate`
  (`useActionState`), tự đóng khi thành công.

## Storage

- Bucket **private** `form-templates` (Supabase Storage). DB chỉ giữ metadata + `file_path`.
- Upload: server action `saveFormTemplate` — upload file trước (path `${uuid}-${sanitized}`),
  rồi upsert row; khi sửa & thay file thì xoá object cũ sau khi upload mới thành công.
- Download: `formDownloadUrl` → `createSignedUrl(path, 60)` (URL sống 60s) → client `window.open`.
- File cho phép: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), ảnh (png/jpg/webp); ≤ 10 MB.

## Category enum (cố định — 9 loại)

`Admission & discharge` · `Care plan` · `Clinical & assessment` · `Consent` · `Incident & risk` ·
`Medication` · `HR & staff` · `Policy & procedure` · `Other`. Nguồn: `src/lib/forms-constants.ts`
(`FORM_CATEGORIES`) + check constraint trong migration. Đổi bộ = sửa cả 2.

## Migration

`supabase/migrations/0024_form_templates.sql` — bucket + RLS `storage.objects` + bảng
`form_templates` + RLS bảng. Sau apply: re-run `scripts/db/seed-core-schema.mts` để seed
`role_permissions` cho module `forms` (giống pattern thêm module mới).

## Spec / plan

- Spec: [2026-07-24-form-templates-library-design.md](../../superpowers/specs/2026-07-24-form-templates-library-design.md)
- Plan: [2026-07-24-form-templates-library.md](../../superpowers/plans/2026-07-24-form-templates-library.md)
