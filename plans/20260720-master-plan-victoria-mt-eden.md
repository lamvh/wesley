# Wesley · Victoria at Mt Eden — Plan tổng

Điểm truy cập duy nhất theo dõi mọi luồng công việc. Mỗi mục có **trạng thái** và link tới plan/spec chi tiết.
Cập nhật lần cuối: **2026-07-20**.

## Chú thích trạng thái

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Đã hoàn thành |
| 🟡 | Đang làm |
| 📋 | Đã plan — chưa bắt đầu code |
| 📝 | Mới có spec/design — chưa có plan triển khai |
| ⏳ | Backlog — chờ quyết định |

---

## Tổng quan các luồng

| # | Luồng | Trạng thái | Plan chi tiết |
|---|-------|------------|---------------|
| A | Design sync + Website CMS | ✅ done (còn 2 follow-up) | [plan.md](./20260718-2250-design-sync-and-cms/plan.md) |
| B | Login username + email (email optional) | ✅ done (đã code + verify e2e) | [spec](../docs/superpowers/specs/2026-07-20-username-email-login-design.md) · [plan](../docs/superpowers/plans/2026-07-20-username-email-login.md) |
| C | Backlog Resident CRUD parity | ⏳ chờ quyết định | [residents.md](../docs/features/portal/residents.md#design-parity--open-items) |
| D | Today roster U1 — trang public `/today` (iPad lễ tân) | 🟡 đang brainstorm | *(spec chưa ghi — đang thiết kế)* |
| E | Duty export trim (P4) — bỏ on-call + chef + fix in 1 trang | 📋 plan xong — chưa code | [plan](../docs/superpowers/plans/2026-07-20-duty-export-trim.md) |
| F | Users full CRUD parity — update/soft-delete/recover + role/building real-data | 📋 plan xong — chưa code | [plan](../docs/superpowers/plans/2026-07-20-users-full-crud.md) |

---

## Luồng A — Design sync + Website CMS

Plan chi tiết: [20260718-2250-design-sync-and-cms/plan.md](./20260718-2250-design-sync-and-cms/plan.md)

- [x] ✅ **A1. Landing pages re-port (v1.0/v1.1)** — header/footer 1 nút Portal, footer 3-col → [landing-audit-log.md](../docs/features/marketing/landing-audit-log.md)
- [x] ✅ **A2. Resident screens v1.2** — bỏ care-tier badge, banner 84px, subtitle "Room {room}" → [residents.md](../docs/features/portal/residents.md)
- [x] ✅ **A3. Roster per-day on-call** — row On call/Nurse-HCA, `onCallByDay`, `buildDutySheets`
- [x] ✅ **A4. Website CMS** — migration `site_content` + RLS, `getSiteContent()`, editor `/portal/website`, rewire 6 trang marketing → [phase-04-website-cms.md](./20260718-2250-design-sync-and-cms/phase-04-website-cms.md)
- [ ] ⏳ **A5. Follow-up — persist on-call theo ngày lên Supabase** (hiện chỉ local state; mirror pattern grid auto-save)
- [ ] ⏳ **A6. Follow-up — chạy `0013_site_content.sql` trên DB + admin-gate server-side cho write action** (RLS hiện là authenticated-write theo pattern MVP)

---

## Luồng B — Login username + email (email optional)

- Spec (đã chốt design): [2026-07-20-username-email-login-design.md](../docs/superpowers/specs/2026-07-20-username-email-login-design.md)
- Plan triển khai (7 task, TDD verify-scripts): [2026-07-20-username-email-login.md](../docs/superpowers/plans/2026-07-20-username-email-login.md)

Quyết định chính: Admin tạo TK (invite-only), username bắt buộc + email tùy chọn; admin đặt mật khẩu không bắt đổi; phân giải identifier **server-side** (Phương án A); email tổng hợp `<username>@no-email.wesley.internal` khi không có email.

**Trạng thái tổng: ✅ done — cả 7 task đã code + code review (2 defect fixed) + verify e2e (Playwright) pass.**

Task theo plan (khớp Task 1–7 trong plan file):

- [x] ✅ **B1. Migration `0014_user_username.sql`** — thêm `app_users.username` (citext unique not null), `email` → nullable, backfill từ local-part
- [x] ✅ **B2. Service-role client + validation** — `src/lib/supabase/admin.ts` + `src/lib/validation/username.ts` (regex, reserved, `resolveAuthEmail`/`syntheticAuthEmail`)
- [x] ✅ **B3. `createUser` server action** — `src/lib/actions/users.ts`: `auth.admin.createUser` + insert `app_users`, rollback nếu insert fail, authz check admin/super_admin (defect 1 đã fix)
- [x] ✅ **B4. `signIn` server action** — `src/lib/actions/auth.ts`: tra username/email → email đăng nhập → `signInWithPassword` (SSR), lỗi đồng nhất
- [x] ✅ **B5. Đọc `app_users` thật + wire AddUserModal** — `src/lib/data/users.ts`, `page.tsx` server-load, modal thêm field `username`+`password`; keying re-key theo `username` thay vì `email` (defect 2 đã fix)
- [x] ✅ **B6. `login-view.tsx`** — 1 field "Username hoặc email" gọi `signIn`
- [x] ✅ **B7. `current-user` + verify e2e** — `username` trong record + query; script `verify-username-email-login-e2e.mts`; journal [2026-07-20-username-email-login-implementation.md](../docs/journals/2026-07-20-username-email-login-implementation.md)

> Commit: `bcbe109` "feat: implement username-based login and user management" (2026-07-20). Code review qua `code-reviewer` bắt được 2 defect (thiếu authz check trong `createUser`, keying theo `email` null-collision) — đã fix cả hai, verify e2e lại pass.
>
> Follow-up còn treo (ngoài scope B, không chặn "done"): rotate `SUPABASE_DB_PASSWORD` trong `.env.local` (đang stale, chặn `scripts/db/apply-migration.mts` + `verify-staff-read.mts`); F0-U/F0-D (edit/delete user) vẫn local-only — xem Luồng F.

---

## Luồng C — Backlog Resident CRUD parity (reported-only, chờ quyết định)

Nguồn: [residents.md — design parity & open items](../docs/features/portal/residents.md#design-parity--open-items)

- [ ] ⏳ **C1.** Room = free-text → `<select>` danh sách room thật
- [ ] ⏳ **C2.** Resident detail thêm room card + link tới room
- [ ] ⏳ **C3/C4.** Model Wing / Care-type vs design (code mở rộng có chủ đích — xác nhận giữ)
- [ ] ⏳ **C5.** Nhãn tier "Normal" vs design "Standard"

---

## Luồng D — Today roster U1 · trang public `/today` (màn mới v3.0)

Nguồn design: Claude Design project **"Wesley MtEden"** (`2e217115-...`), file `Victoria at Mt Eden.dc.html` (`section=site&sitePage=today`); board `Victoria - Landing.dc.html`, frame **U1**, **v3.0**.

Mô tả: trang **public "Today on duty"** cho **iPad ở quầy lễ tân** — đồng hồ chạy realtime + danh sách nhân viên **trực hôm nay theo tòa nhà** (Wesley / The Lodge).

**Trạng thái tổng: 🟡 đang brainstorm** (chưa ghi spec).

Quyết định đã chốt:
- [x] ✅ **D0. Nguồn dữ liệu** — RPC **`SECURITY DEFINER` `today_on_duty()`** cho anon (RLS `roster_shifts`/`staff`/`shift_templates` đều chặn anon; trang public nên không dùng anon-select trực tiếp). Bề mặt lộ tối thiểu: chỉ tên, vai trò, giờ ca, tòa nhà cho hôm nay.

Đang chờ / bước tiếp:
- [x] ✅ **D1.** Trích xuất pixel design màn `today` — xong (full markup + data model + live-clock logic + style spec). Tóm tắt layout:
  - Wrapper `#ECE4D4`, sheet A4 794px `min-height:1123px`, viền trên navy 6px + brass 2px.
  - Header: chấm "Live" xanh (`#6E875E`) + `todayDateLabel` (VD "Monday, 20 July 2026") + đồng hồ `todayClock` (HH:MM tabular).
  - Masthead: eyebrow "Victoria at Mt Eden", title serif 66px "Duty Roster", subtitle italic + ngày.
  - 2 cột `Wesley | The Lodge`; các band **NURSE / A/C / HCA / CARE TAKER** rồi **Kitchen** (cột Lodge trống); mỗi dòng `{time}` (min-width 120px, `#8A8172`) + `{name}` in đậm.
  - Live clock: `setInterval 15s`, chỉ tick khi ở trang today; `_now = new Date()`; `todayIdx = (getDay()+6)%7` map thứ thật → cột roster. KHÔNG có highlight "on now".
  - Fonts: Newsreader (serif titles) + Instrument Sans. Board frame `Victoria - Landing.dc.html` = U1, autosize iframe.
- [ ] 🟡 **D2.** Trình bày 2–3 phương án layout + thiết kế chi tiết (đồng hồ live, nhóm theo tòa nhà, khung iPad)
- [ ] 📝 **D3.** Ghi spec `docs/superpowers/specs/2026-07-20-today-roster-design.md` → duyệt → `writing-plans`

Ràng buộc đã biết:
- Route `/today` nằm trong `(marketing)` (public; middleware chỉ chặn `/portal` + `/login`).
- The Lodge hiện chưa lưu roster assignment (`getRosterAssignments` lọc `building_id='wesley'`) → cột Lodge có thể rỗng; cần xác nhận khi thiết kế.

---

## Luồng E — Duty export trim (P4) · bỏ on-call + chef khỏi bản xuất

Nguồn design: Claude Design **"Wesley MtEden"** (`2e217115-...`), `Victoria at Mt Eden.dc.html` **v2.5 "Duty export trimmed"** (mở từ tile **P4 Roster & shifts** → nút *Export duty roster*; board `Victoria - Admin Dashboard.dc.html` tile *Duty roster (export)* `ver 2.5, h:1320px`).

Vấn đề: **design đã bỏ** on-call + chef khỏi cả modal xuất lẫn tờ in (v2.5), nhưng **code Next.js vẫn còn** (mirror bản v1.2 cũ). Cần đồng bộ code theo design đã chốt.

**Trạng thái tổng: 📋 chốt scope — sẵn sàng plan.**

Quyết định đã chốt (2026-07-20): (1) chỉ gỡ khỏi **modal + sheet xuất**, **giữ** on-call row của roster grid (A3). (2) **Gỡ luôn code chết** — state, type, compute, không chỉ ẩn UI.

Đã verify (design đã bỏ, chỉ code còn):
- [x] ✅ **E0. Verify design** — modal xuất chỉ còn *What to export* + *Day*; tờ in chỉ NURSE/A-C/HCA/CARE TAKER + Kitchen + footer (không có dòng On call/Chef).

Điểm sửa trong code (đã chốt scope):
- [ ] 📋 **E1.** `components/portal/roster/duty-roster-modal.tsx` — bỏ 2 `<select>` On call + Chef và props `onOnCall`/`onChef`.
- [ ] 📋 **E2.** `components/portal/roster/duty-roster-sheet.tsx` — bỏ strip `DutyMeta "On call"` + `"Chef"`.
- [ ] 📋 **E3.** `components/portal/roster/roster-view.tsx` — bỏ seed `dutyForm.onCall/chef`, handler `patchDuty({onCall/chef})`, prop truyền xuống (giữ nguyên **on-call row của roster grid** — A3).
- [ ] 📋 **E4.** `types/domain.ts` — bỏ field `onCall`/`chef` khỏi `DutyForm` + DutySheet; `lib/duty-roster.ts::buildDutySheets` bỏ tính on-call/chef. (Giữ `onCallOptions`/`onCallByDay` vì roster grid A3 vẫn dùng.)
- [ ] 📋 **E5. Print 1 trang (single day)** — `globals.css` `@media print .duty-sheet` đang `min-height:296mm` (sát A4 297mm) → tràn sang trang 2. Đổi thành `height:296mm; min-height:0; overflow:hidden` để mỗi sheet đúng 1 trang.

Plan chi tiết: [docs/superpowers/plans/2026-07-20-duty-export-trim.md](../docs/superpowers/plans/2026-07-20-duty-export-trim.md)

---

## Luồng F — Users real-data · full CRUD parity

Nguồn: report của bạn — "chưa thể xoá user", "chưa update được user", "role khi tạo chưa match role thực tế từ real data" → **check full CRUD User + thông tin liên quan khi tạo**. Liên quan Luồng B (B5 ghi *edit/delete vẫn local — ngoài phạm vi*).

**Trạng thái tổng: 📝 brainstorm — root cause đã xác định cho cả 4 thao tác.**

Hiện trạng CRUD (đã verify từ code):
- [x] ✅ **F0-C. Create** — ✅ **persist** qua `createUser` (`users-view.tsx:110`). Nhưng: option role lấy từ `ROLE_KEYS` (mock-data) → có thể lệch `app_users.role_id` thật; `building_id`='wesley' và `status`='Active' hardcode; chưa set `last_active_at`.
- [x] ✅ **F0-R. Read** — ✅ real data (`data/users.ts` select `app_users`).
- [x] ✅ **F0-U. Update** — ❌ **local-only**: `users-view.tsx:84` chỉ `setUsers(map…)`; **chưa có `updateUser` action** (users.ts chỉ export `createUser`). ⇒ sửa xong, refresh mất.
- [x] ✅ **F0-D. Delete** — ❌ **local-only**: `users-view.tsx:120 doDelete()` chỉ `setUsers(filter…)`; chưa có `deleteUser` action (chỗ `users.ts:65` chỉ rollback auth). ⇒ refresh user quay lại.
- [x] ✅ **F0-role. Role lệch** — create lưu `role_id = form.role` (= `ROLE_KEYS` mock), real data map `userRoleMeta[role_id]`. Nếu `ROLE_KEYS` ≠ `role_id` thật trong DB ⇒ badge/filter role sai.

Quyết định đã chốt (2026-07-20): (1) Delete = **soft-delete + recover được**. (2) Role option = **real data từ bảng `roles`** (không dùng `ROLE_KEYS` mock). (3) Create/Edit **cho chọn toà nhà** (Wesley/The Lodge từ `buildings`). (4) Update = **sửa toàn bộ** field (name/username/email/password/role/scope/building).

Ràng buộc schema (đã xem migrations):
- `roles` table có sẵn (`0001_core_schema.sql:9`, seed :96) → nguồn role thật (`id,label,description`).
- `app_users.status` hiện chỉ `check in ('Active','Invited','Suspended')` → **chưa có trạng thái "deleted"**. Soft-delete cần **migration**: hoặc thêm `deleted_at timestamptz` (khuyến nghị — recover = set null; list mặc định lọc `deleted_at is null`), hoặc nới `status` thêm `'Archived'`.
- `building_id` đã references `buildings(id)` (nullable) → chỉ cần select ở UI.

Điểm sửa (đã chốt scope):
- [ ] 📋 **F1. Migration soft-delete** — `0015_app_users_soft_delete.sql`: thêm `deleted_at timestamptz` + index; `data/users.ts` lọc `deleted_at is null` mặc định.
- [ ] 📋 **F2. Delete action** — `deleteUser` = set `deleted_at = now()` (giữ auth để recover được); `recoverUser` = set `deleted_at = null`; guard admin/super_admin; `revalidatePath`. Wire `doDelete` gọi action. (Cân nhắc: khoá đăng nhập khi bị soft-delete — ban auth user hoặc chặn ở `signIn`.)
- [ ] 📋 **F3. Update action** — `updateUser` sửa **toàn bộ**: name/email/role/scope/building + đổi `username` (citext unique) + đổi `password` (`auth.admin.updateUserById`). Wire nhánh `editingUsername` gọi action thay `setUsers(map…)`.
- [ ] 📋 **F4. Role từ real data** — modal & filter lấy option role từ bảng `roles` (server-load truyền xuống), bỏ phụ thuộc `ROLE_KEYS` mock; `createUser` giữ `role_id = role` đã là id thật.
- [ ] 📋 **F5. Building select** — thêm select toà nhà (từ `buildings`) vào add/edit modal; `createUser`/`updateUser` set `building_id` thay hardcode `'wesley'`.
- [ ] 📋 **F6. Verify e2e** — script tạo → sửa (đổi role/building/pass) → soft-delete → recover; cập nhật `docs/screen-registry` + `docs/features/portal` (No code before its doc).

> Mở: cơ chế soft-delete = `deleted_at` (khuyến nghị) hay `status='Archived'`? — chốt trước khi viết plan.

---

## Track log / History (mốc đã hoàn thành — không xóa)

Ghi theo ngày, mới nhất trên cùng. Đây là nhật ký các mốc **planning/design** đã xong; task code hoàn thành cũng chuyển vào đây kèm ngày.

- **2026-07-20** — ✅ Luồng B: **code xong cả B1–B7** (commit `bcbe109`), code review bắt 2 defect (thiếu authz `createUser`, keying theo `email` null-collision) → đã fix, verify e2e (Playwright) pass. Chuyển 📋 → ✅. Journal: [2026-07-20-username-email-login-implementation.md](../docs/journals/2026-07-20-username-email-login-implementation.md).
- **2026-07-20** — 🟡 Luồng E + F: intake brainstorm. E = Duty export trim (design v2.5 đã bỏ on-call/chef, code còn) — verify design xong. F = Users full CRUD parity (Create ✅ persist / Read ✅ / Update ❌ local / Delete ❌ local; role lệch ROLE_KEYS vs DB) — root cause xong, chờ chốt scope.
- **2026-07-20** — ✅ Luồng D: bắt đầu brainstorm "Today roster U1" (`/today`); chốt nguồn dữ liệu = RPC `SECURITY DEFINER` cho anon (D0).
- **2026-07-20** — ✅ Luồng B: viết xong **implementation plan** (7 task, TDD verify-scripts) → [plan](../docs/superpowers/plans/2026-07-20-username-email-login.md). Chuyển 📝 → 📋.
- **2026-07-20** — ✅ Luồng B: **brainstorm + spec design** được duyệt (admin tạo TK invite-only, username bắt buộc + email optional, Phương án A) → [spec](../docs/superpowers/specs/2026-07-20-username-email-login-design.md).
- **2026-07-20** — ✅ Luồng A4: Website CMS hoàn thành (migration `site_content` + RLS, editor `/portal/website`, rewire 6 trang marketing).
- **≤2026-07-18** — ✅ Luồng A1–A3: re-port landing pages, resident screens v1.2, roster per-day on-call.

---

## Ghi chú

- Đã build sẵn (không cần làm): Staff Team search+pagination, bỏ cột Wing, Staff Roles & groups, Rates (trong tab Payroll), Payroll.
- Nguồn design authoritative: `.design-src/Victoria-at-Mt-Eden-2026-07-18.dc.html` (v1.2). Màn `today` v3.0 lấy từ Claude Design MCP (chưa sync về `.design-src`).
- Quy tắc bất di bất dịch: **No code before its doc** (xem [00-rules-and-conventions.md](../docs/00-rules-and-conventions.md)).

## Câu hỏi chưa giải quyết

1. Luồng A5/A6: chạy ngay hay gộp vào đợt tích hợp DB chung? (B đã xong nên không còn lý do gộp riêng theo B)
2. Luồng C: các mục parity — giữ code hiện tại hay chỉnh theo design? Cần quyết định của bạn.
3. Luồng D: The Lodge chưa có dữ liệu roster — hiển thị cột rỗng, ẩn, hay chỉ hiện Wesley? (chốt khi thiết kế)
4. Rotate `SUPABASE_DB_PASSWORD` trong `.env.local` (stale, phát hiện khi làm B) — ai làm, khi nào?
