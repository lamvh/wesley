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

| # | Luồng | Trạng thái | Plan / spec |
|---|-------|------------|-------------|
| A | Design sync + Website CMS | ✅ done (A5 code xong; A6 ⏳) | [plan.md](./20260718-2250-design-sync-and-cms/plan.md) |
| B | Login username + email (email optional) | ✅ done (code + review + verify e2e) | [spec](../docs/superpowers/specs/2026-07-20-username-email-login-design.md) · [plan](../docs/superpowers/plans/2026-07-20-username-email-login.md) |
| C | Backlog Resident CRUD parity | ✅ done (C1–C5) | [residents.md](../docs/features/portal/residents.md#design-parity--open-items) |
| D | Today roster U1 — public `/today` (iPad lễ tân) | ✅ code xong (`tsc`/eslint sạch) | [spec](../docs/superpowers/specs/2026-07-20-today-roster-design.md) · [plan](../docs/superpowers/plans/2026-07-20-today-roster-public-page.md) |
| E | Duty export trim (P4) — bỏ chef + fix in 1 trang; **on-call quay lại (2026-07-20)** | ✅ done (code, `tsc`/eslint sạch) | [plan](../docs/superpowers/plans/2026-07-20-duty-export-trim.md) |
| F | Users full CRUD parity — update/soft-delete/recover + role/building real-data | ✅ code xong | [plan](../docs/superpowers/plans/2026-07-20-users-full-crud.md) |

> Chi tiết từng luồng đã hoàn thành → xem **Track log** + file plan/spec/journal tương ứng. Phần dưới chỉ liệt kê **việc còn mở**.

---

## Việc còn mở (open items)

> Migration + verify DB do **bạn tự chạy manual**. Các mục dưới là checklist để bạn tick khi chạy xong; không còn coi là blocker.

### Luồng D — Today page (bạn chạy manual)
- [ ] **D-v1.** Apply `supabase/migrations/0016_today_on_duty.sql` + `0018_today_on_call.sql`.
- [ ] **D-v2.** Chạy `verify-today-on-duty-rpc.mts` + `verify-today-board-e2e.mts` + `verify-today-on-call-rpc.mts` + `verify-today-on-call-e2e.mts` → anon gọi RPC + thấy ca hôm nay + on-call hôm nay.
- [ ] **D-v3.** Test thủ công `/today` (không đăng nhập): đồng hồ live 15s, cột Wesley có data, Lodge "—", strip **On call** hiện đúng tên (hoặc "-" nếu chưa set).
- [x] ✅ **D-v4.** Docs: `/today` (U1, v3.0) đã vào [screen-registry.md](../docs/screen-registry.md) + [today-roster.md](../docs/features/marketing/today-roster.md).
- [x] ✅ **D-v5. On-call thêm vào `/today` (2026-07-20)** — bạn báo "export template và /today vẫn không có on-call" sau khi cập nhật A5; scout xác nhận đây là scope loại trừ có chủ đích (không phải bug) ở cả 2 nơi, bạn xác nhận muốn thêm lại **cả 2**. RPC mới `today_on_call()` (migration `0018_today_on_call.sql`, mirror pattern `today_on_duty`, chỉ trả `building_id, staff_name`); `getTodayOnCall()`; `buildTodayBoard(rows, onCallRows)` thêm field `onCall`; `TodayBoard` render strip "On call" dưới header toà nhà.
- Giả định đã chốt: Lodge = option (a) cột rỗng "—"; đồng hồ tính client (iPad set giờ NZ); band map theo `staff.role` substring (role lạ → band "OTHER"); on-call chỉ track Wesley (giống roster grid).

### Luồng F — Users CRUD (bạn chạy manual)
- [ ] **F-v1.** Chạy `verify-user-crud-e2e.mts` (update/soft-delete/recover/login-block).
- [ ] **F-v2.** Test thủ công UI: sửa toàn bộ field + đổi mật khẩu; xoá → "Đã xoá" → khôi phục; login TK đã xoá bị chặn.
- [ ] **F-v3.** Test thủ công rename role: `/portal/users` → tab "Roles & permissions" → hover role card (không phải Super Admin) → nút bút chì → sửa tên → Enter → tên đổi ở card, panel bên phải, badge role trong bảng Users, và dropdown role của Add/Edit modal.

### Luồng E — Duty export
- [ ] **E-v1. ⚠️ CẦN BẠN TEST TRỰC TIẾP** (không tự động verify được, xem E-v3): `/portal/roster` → Export → Single day → Print = **1 trang** (không phải 2 trang giống nhau); Export → Whole week → Print = **7 trang khác nhau theo thứ** (không phải lặp Monday); strip **On call** hiện đúng tên đã chọn ở grid cho ngày đó.
- [x] ✅ **E-v2. On-call quay lại export (2026-07-20)** — đảo ngược một phần quyết định E gốc (design v2.5 đã bỏ on-call+chef khỏi export) theo yêu cầu của bạn. Chỉ **on-call** quay lại (không phải qua modal input như bản cũ, mà lấy **live từ roster grid's on-call row** — cùng nguồn A5); **Chef vẫn bỏ** (không được yêu cầu, chưa từng persist). `DutySheet.onCall`, `buildDutySheets(..., onCallNameByDay)`, `OnCallStrip` trong `duty-roster-sheet.tsx`. Ghi chú đảo ngược trong [duty-export-trim.md](../docs/superpowers/plans/2026-07-20-duty-export-trim.md).
- [x] 🐛 **E-v3. Fix duty print bị lặp trang (2026-07-20)** — 2 root cause: (1) `DUTY_DEFAULTS.scope` sai là `"week"` (đúng theo design là `"day"`) → bấm print mặc định export cả tuần thay vì 1 ngày; (2) `DutyRosterPreview` overlay là `position: fixed` — theo CSS spec, phần tử fixed **lặp lại trên mọi trang khi in**, khiến trang đầu (Monday/ngày đang chọn) đè lên mọi trang sau thay vì nội dung thật chảy sang trang tiếp. Fix: đổi default sang `"day"`; thêm class `duty-preview-overlay` + override `position: static` trong `@media print`. **Chưa verify bằng công cụ tự động được** (headless print-to-pdf repro không đáng tin — không phân trang đúng cả với case test 3 trang đơn giản) — `tsc`/eslint/`next build` sạch nhưng **bạn cần tự test bằng mắt** (xem E-v1). Chi tiết: [roster-shifts.md](../docs/features/portal/roster-shifts.md#fixed-2026-07-20-duty-print-showed-duplicate-pages).
- [x] ✅ **E-v4. Sửa nội dung print sheet (2026-07-20)** — theo yêu cầu của bạn: eyebrow đổi "Victoria at Mt Eden" (tên cơ sở, không phải brand công khai) → "Wesley Home & Care" (đúng brand dùng xuyên suốt app: nav, footer, login, `layout.tsx`); bỏ dòng "Prepared from published roster" ở footer, chỉ còn ngày (căn phải). Áp dụng cho cả `duty-roster-sheet.tsx` (luồng E) và `today-board.tsx` (`/today`, luồng D — bạn xác nhận "sửa luôn") — 2 màn share chung pattern masthead/footer này. Đã cập nhật spec D3 (`today-roster-design.md`) + `today-roster.md` cho khớp code (đảo ngược có ghi chú, không âm thầm). `tsc`/eslint/`next build` sạch.

### Luồng A5 — Persist on-call (bạn chạy manual)
- [x] ✅ **A5-code.** Persist on-call theo ngày lên Supabase — migration `0017_roster_on_call.sql` (bảng `roster_on_call`, `unique(building_id, on_call_date)`), `getOnCallByDay()` + `setOnCallDay`/`clearOnCallDay` (mirror `roster_shifts` auto-save), `RosterView` seed từ `initialOnCallByDay`, picker value đổi từ **tên** sang **staff id**. `tsc`/eslint sạch. Docs: [roster-shifts.md](../docs/features/portal/roster-shifts.md).
- [ ] **A5-v1.** Apply `supabase/migrations/0017_roster_on_call.sql`.
- [ ] **A5-v2.** Chạy `verify-roster-on-call-table.mts` + `verify-roster-on-call-crud.mts`.
- [ ] **A5-v3.** Test thủ công `/portal/roster`: chọn on-call 1 ngày → refresh → vẫn còn; đổi tuần rồi quay lại → vẫn đúng.

### Luồng A6 — follow-up (⏳ chờ quyết định)
- [ ] **A6.** Chạy `0013_site_content.sql` trên DB + admin-gate server-side cho write action (RLS hiện authenticated-write theo MVP).

---

## Track log / History (mốc đã hoàn thành — không xóa)

Ghi theo ngày, mới nhất trên cùng.

- **2026-07-20** — 🐛 **Fix (/fix): "on-call đã cập nhật nhưng export template và /today vẫn không có".** Bạn báo cáo tưởng là bug; scout (`docs/superpowers/plans/2026-07-20-duty-export-trim.md:5,7,13` + `docs/superpowers/specs/2026-07-20-today-roster-design.md:11,33`) xác nhận **cả 2 đều là loại trừ có chủ đích, đã ghi tài liệu trước khi code** — không phải bug: Luồng E chủ động bỏ on-call+chef khỏi export theo design v2.5; `/today` chưa từng scope on-call vào RPC gốc. Hỏi lại bạn theo quy tắc "không tự đảo ngược quyết định đã chốt" → bạn xác nhận muốn thêm on-call vào **cả 2 nơi**. Đã code: (E) `DutySheet.onCall` + `buildDutySheets(..., onCallNameByDay)` + `OnCallStrip` trong tờ in (lấy live từ roster grid, không qua modal); (D) RPC mới `today_on_call()` (`0018_today_on_call.sql`) + `getTodayOnCall()` + `buildTodayBoard(rows, onCallRows)` + `OnCallStrip` trong `TodayBoard`. Tiện thể dọn `TodayDutyRow` bị khai báo trùng 2 lần trong `types/domain.ts` (harmless nhưng dư thừa, do một tiến trình khác để lại). `tsc --noEmit` + eslint sạch toàn repo. Verify RPC mới chưa chạy được (cùng vấn đề kết nối DB local). Docs: [roster-shifts.md](../docs/features/portal/roster-shifts.md), [today-roster.md](../docs/features/marketing/today-roster.md), [duty-export-trim.md](../docs/superpowers/plans/2026-07-20-duty-export-trim.md).
- **2026-07-20** — 🐛 **Fix Luồng F: "chưa thể rename user role".** Root cause kép: (1) không có UI/action nào để đổi tên role tài khoản (`public.roles.label`) — chỉ có rename cho **staff job-role** khác (`lib/actions/roles.ts::renameRole`, dùng cho Staff > Roles & groups, không liên quan); (2) kể cả nếu update DB, các chỗ hiển thị tên role (role card, permission-matrix header, badge trong bảng Users) đang đọc `userRoleMeta[role].label` **tĩnh, hardcode** trong `design-meta.ts` (vd "Admin") chứ không phải `roles.label` thật từ DB (vd "Administrator") — nên rename sẽ "vô hình". Fix: (a) `listUserRoles()` trả thêm `is_system`; (b) action mới `renameUserRole(id, label)` (`lib/actions/user-roles.ts`, admin-only qua `requireAdmin` export từ `users.ts`, chặn nếu `is_system`, dùng service-role client vì bảng `roles` không có write RLS cho session thường); (c) `roles-permissions.tsx` thêm inline-rename (bút chì, ẩn ở role hệ thống `super_admin`) + đổi hiển thị tên sang `roles` thật (card list + panel header); (d) `user-table.tsx` badge role trong bảng Users cũng đổi sang label thật (cùng lỗi, cùng blast radius). `tsc --noEmit`/eslint/`next build` sạch toàn repo. Docs: [users-access.md](../docs/features/portal/users-access.md).
- **2026-07-20** — ✅ **Luồng A5: code xong** persist on-call lên Supabase. Migration `0017_roster_on_call.sql` (bảng `roster_on_call`, `unique(building_id,on_call_date)`, RLS authenticated read/write, mirror `roster_shifts`); `getOnCallByDay()` (`lib/data/roster.ts`); `setOnCallDay`/`clearOnCallDay` (`lib/actions/roster.ts`, upsert/delete + `revalidatePath`); `RosterView` nhận `initialOnCallByDay` từ `page.tsx`, seed state, gọi action optimistic mirror pattern grid. Đổi picker `value` từ tên sang **staff id** để tránh trùng tên. Verify `verify-roster-on-call-table.mts` + `verify-roster-on-call-crud.mts` (chưa chạy được — cùng vấn đề kết nối DB local như D/F). `tsc --noEmit` + eslint sạch. Docs: [roster-shifts.md](../docs/features/portal/roster-shifts.md).
- **2026-07-20** — 🐛 **Fix Luồng F: "Roles & permissions" tab chưa lấy role từ real data.** Root cause: F4 chỉ sửa Add/Edit modal (`add-user-modal.tsx`) và filter pills (`role-filter-pills.tsx`) dùng `roles` thật, nhưng bỏ sót `roles-permissions.tsx` (tab Roles & permissions) — component này vẫn `import { ROLE_KEYS } from "@/lib/mock-data"` để render danh sách role card. Fix: `roles-permissions.tsx` nhận prop `roles` (real `public.roles` qua `listUserRoles()`, đã có sẵn ở `page.tsx`) thay vì `ROLE_KEYS`; `users-view.tsx` truyền `roles` xuống. `tsc --noEmit` sạch (trừ 1 lỗi không liên quan, đang WIP ở `roster-view.tsx`/luồng A5 — không đụng vào).
- **2026-07-20** — ✅ **Luồng D: code xong** trang public `/today`. Migration `0016_today_on_duty.sql` (RPC `SECURITY DEFINER`, lọc ngày NZ `Pacific/Auckland`, grant anon); `src/lib/data/today-on-duty.ts` (gọi RPC), `src/lib/today-board.ts` (gom band + 2 cột, Lodge option a, role lạ → "OTHER"), types `TodayDutyRow`/`TodayBand`/`TodayBoardSheet`, route `src/app/(marketing)/today/page.tsx` (force-dynamic), client `src/components/marketing/today-board.tsx` (đồng hồ live 15s). Verify `verify-today-on-duty-rpc.mts` + `verify-today-board-e2e.mts`. `tsc --noEmit` + eslint sạch. **Chưa verify DB** (chờ rotate password) — xem open items D. Spec: [today-roster-design.md](../docs/superpowers/specs/2026-07-20-today-roster-design.md) · Plan: [today-roster-public-page.md](../docs/superpowers/plans/2026-07-20-today-roster-public-page.md).
- **2026-07-20** — ✅ **Luồng C1/C2/C5**: room field → `<select>` từ `getRooms()` + validate ở `saveResident`; `room-card.tsx` trong resident detail (status badge + link `/portal/rooms/{num}`); tier-filter-pills đổi label "Normal"→"Standard" (type `CareTier` giữ `"Normal"`). Luồng C **done 5/5**. `tsc`/eslint/`next build` sạch. Docs: [residents.md](../docs/features/portal/residents.md#room-select--detail-room-card--tier-label-2026-07-20).
- **2026-07-20** — ✅ **Luồng E + F: code xong theo plan**. E (5/5) — bỏ on-call/chef khỏi modal + sheet xuất, giữ grid on-call (A3), fix in single-day 1 trang (`min-height:296mm` → `height:296mm; overflow:hidden`). F (6/6) — migration `0015_app_users_soft_delete.sql`, `updateUser`/`deleteUser`/`recoverUser` actions, chặn login TK đã xoá (`signIn`), role/building option từ real data (`listUserRoles`/`listBuildings`), UI wiring đầy đủ (edit/delete/recover thật). `tsc`/eslint sạch cả 2. Chưa verify DB (password stale); F1 migration đã apply thủ công qua dashboard (bạn xác nhận). Docs: [03-data-model.md](../docs/03-data-model.md), [roster-shifts.md](../docs/features/portal/roster-shifts.md), [users-access.md](../docs/features/portal/users-access.md). Plan E: [duty-export-trim.md](../docs/superpowers/plans/2026-07-20-duty-export-trim.md) · Plan F: [users-full-crud.md](../docs/superpowers/plans/2026-07-20-users-full-crud.md).
- **2026-07-20** — ✅ **Luồng C3/C4:** xoá hẳn Wing + Care-type khỏi model/form/actions/data resident (quyết định của bạn). Không cần migration (cột đã nullable). `tsc`/eslint sạch. Docs: [residents.md](../docs/features/portal/residents.md#wing--care-type-removal-2026-07-20).
- **2026-07-20** — ✅ **Luồng B: code xong B1–B7** (commit `bcbe109`), code review bắt 2 defect (thiếu authz `createUser`, keying theo `email` null-collision) → fix, verify e2e (Playwright) pass. Journal: [2026-07-20-username-email-login-implementation.md](../docs/journals/2026-07-20-username-email-login-implementation.md). Quyết định: admin tạo TK invite-only, username bắt buộc + email optional, phân giải identifier server-side (Phương án A), email tổng hợp `<username>@no-email.wesley.internal`.
- **2026-07-20** — ✅ Luồng B: plan (7 task) → 📋; brainstorm + spec design duyệt → 📝.
- **2026-07-20** — ✅ Luồng D: brainstorm — chốt RPC `SECURITY DEFINER` cho anon (D0); trích xuất pixel design (D1); Lodge = option (a); spec + plan (D2/D3).
- **2026-07-20** — ✅ Luồng E + F: intake brainstorm → chốt scope (E giữ grid on-call + gỡ code chết; F soft-delete `deleted_at`, role/building real-data, update toàn bộ).
- **2026-07-20** — ✅ Luồng A4: Website CMS (migration `site_content` + RLS, editor `/portal/website`, rewire 6 trang marketing).
- **≤2026-07-18** — ✅ Luồng A1–A3: re-port landing pages, resident screens v1.2, roster per-day on-call.

---

## Ghi chú

- Đã build sẵn (không cần làm): Staff Team search+pagination, bỏ cột Wing, Staff Roles & groups, Rates (tab Payroll), Payroll.
- Nguồn design authoritative: `.design-src/Victoria-at-Mt-Eden-2026-07-18.dc.html` (v1.2). Màn `today` v3.0 lấy từ Claude Design MCP (chưa sync về `.design-src`).
- Quy tắc bất di bất dịch: **No code before its doc** (xem [00-rules-and-conventions.md](../docs/00-rules-and-conventions.md)).

## Câu hỏi chưa giải quyết

1. Luồng A6: chạy ngay hay gộp đợt tích hợp DB chung? (A5 đã code xong, chỉ còn verify DB thủ công — xem open items)
2. Luồng D: xác nhận `staff.role` thật để chốt mapping band (hiện fallback "OTHER" an toàn); có cần chấm "Live" nhấp nháy không?
