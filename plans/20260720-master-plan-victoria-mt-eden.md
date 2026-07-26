# Wesley · Victoria at Mt Eden — Plan tổng

Điểm truy cập duy nhất theo dõi mọi luồng công việc. Mỗi mục có **trạng thái** và link tới plan/spec chi tiết.
Cập nhật lần cuối: **2026-07-27**.

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
| A | Design sync + Website CMS | ✅ done (A5 code xong; A6 `0013` đã chạy) | [plan.md](./20260718-2250-design-sync-and-cms/plan.md) |
| H | Preferred name cho Staff | ✅ done code (verify DB manual) | [spec](../docs/superpowers/specs/2026-07-22-staff-preferred-name-design.md) · [plan](../docs/superpowers/plans/2026-07-22-staff-preferred-name.md) |
| M | Forms — thư viện biểu mẫu (admin) | ✅ done code (verify manual) | [spec](../docs/superpowers/specs/2026-07-24-form-templates-library-design.md) · [plan](../docs/superpowers/plans/2026-07-24-form-templates-library.md) |
| I | Roster shift picker — group theo role: Group role → role → shift | ✅ done code | — |
| K | Roster — copy lịch tuần trước | ✅ done code (test tay K-v1) | — |
| F-perm | Permission matrix đọc/ghi thật vào `role_permissions` | ✅ done code (test tay F-perm-v1) | — |
| N | Staff leave — sick/annual balance + fix "On leave" + list 10 dòng | 🟡 N-3 xong; N-1 chưa code; N-2 chờ data của bạn | — |
| L | Roster — gợi ý ca mà staff đó thường làm | ⏳ backlog — chờ quyết định | — |

> Các luồng đã done cả code (B, C, D, E, F, G, J) đã gỡ khỏi bảng này — xem **Track log** bên dưới để biết chi tiết.

> Chi tiết từng luồng đã hoàn thành → xem **Track log** + file plan/spec/journal tương ứng. Phần dưới chỉ liệt kê **việc còn mở**.

---

## Việc còn mở (open items)

> Chỉ liệt kê việc **chưa xong**. Mọi mục đã hoàn thành đã chuyển xuống **Track log**.
> Migration + verify DB do **bạn tự chạy manual**.

### ① SQL — ✅ đã chạy xong (2026-07-27)

Không còn file SQL nào chờ. Bạn đã chạy cả `0004` lẫn `0005`; verify qua REST **8/8 pass**:

| File | Kết quả verify | Đóng |
|---|---|---|
| `supabase/seed/0004_role_permissions_seed.sql` | `role_permissions` = **308 dòng** (7 role × 11 module × 4 action); đủ 7 role kể cả `stock_manager`, đủ 11 module kể cả `forms`; `stock_manager` granted đúng 5 ô (`dashboard.view` + `stock` CRUD); `forms` granted đúng 8 ô (super_admin + admin, còn lại NONE). | **G-v2**, **M-v2** |
| `supabase/seed/0005_shift_template_colors.sql` | 26 ca → **26 màu riêng**; **0 ca** còn mustard cũ `#87651A`; đang dùng đủ **14 hue family**. | **J-v3** |

Sinh lại bất cứ lúc nào (sau khi thêm role/module hoặc thêm/bớt shift template): `npx tsx scripts/db/emit-role-permissions-seed-sql.mts` · `npx tsx scripts/db/emit-shift-template-colors-sql.mts`

### ② Blocker — password DB stale

- [ ] **DB-1.** `.env.local` (`DIRECT_URL` / `SUPABASE_DB_PASSWORD`) đã hết hạn → mọi script nối `pg` trực tiếp fail `password authentication failed for user "postgres"`: `verify-app-users-soft-delete.mts` (kéo theo **F-v1** `verify-user-crud-e2e.mts`), `verify-roster-on-call-table.mts`, `check-staff-preferred-name-column.mts`, `seed-core-schema.mts`. **Không phải lỗi migration** — các đường REST/service-role đều pass. Cần bạn cập nhật password rồi chạy lại.

### ③ Test tay (không tự động verify được)

- [ ] **E-v1.** `/portal/roster` → Export → Single day → Print = **1 trang**; Whole week → Print = **7 trang khác nhau theo thứ**; strip On call đúng tên đã chọn ở grid cho ngày đó.
- [ ] **E-v6.** `/today` (full-page, không nav/footer) và `/portal/roster` → Export preview hiển thị **giống hệt** (masthead, building header, on-call strip, các band, Kitchen band chung, footer).
- [ ] **E-v8.** (1) seed 1 staff role Nurse có 1 ca Kitchen → Export + `/today` ca đó nằm band **Kitchen**. (2) seed 1 ca template `building_id='lodge'` → `/today` hiện đúng cột **The Lodge**, khớp export.
- [ ] **D-v3.** `/today` (không đăng nhập): đồng hồ live 15s, cột Wesley có data, Lodge "—", strip On call đúng tên (hoặc "-").
- [ ] **F-v2.** `/portal/users`: sửa toàn bộ field + đổi mật khẩu; xoá → "Đã xoá" → khôi phục; login TK đã xoá bị chặn.
- [ ] **F-v3.** Rename role: tab "Roles & permissions" → hover role card (không phải Super Admin) → nút bút chì → sửa tên → Enter → tên đổi ở card, panel phải, badge trong bảng Users, và dropdown role của Add/Edit modal.
- [ ] **G-v3.** Tab Roles & permissions: có role card "Stock Manager" (bronze), đúng matrix (dashboard view + stock ALL, còn lại NONE); Add/Edit user role picker có "Stock Manager".
- [ ] **M-v3.** `/portal/forms` (admin): Add form → upload PDF → hiện trong list; Download mở đúng file; Edit đổi name/category + thay file (file cũ bị gỡ); Delete gỡ cả row + object; filter category + search hoạt động.
- [ ] **M-v4.** Login role non-admin → **không thấy** menu Forms.
- [ ] **I-v1.** Picker 1 ô: thấy header group (Nurses/HCA), sub-header role, ca dưới từng role; staff nhiều role thấy đúng nhiều group; toggle ca + "Day off" vẫn chạy. Case: gán 1 ca rồi đổi role staff → ca cũ vẫn hiện ở "Assigned · other roles", bỏ chọn được.
- [ ] **J-v2.** Mỗi ca (chip) màu riêng dễ phân biệt; roster band tách **Nurse** riêng, **HCA** riêng; Team Leader rơi vào "Unassigned" cuối. Tab Staff → Roles & groups hiển thị đúng 2 group mới.
- [ ] **A5-v3.** `/portal/roster`: chọn on-call 1 ngày → refresh → vẫn còn; đổi tuần rồi quay lại → vẫn đúng.
- [ ] **K-v1.** `/portal/roster` → nút **"Copy tuần trước"** trên toolbar: đổ ca tuần trước sang tuần đang xem cho mọi staff; ca đã có giữ nguyên; bấm lần 2 báo "đã có đủ". Hover 1 dòng staff → nút **⟲** chỉ đổ dòng đó.
- [ ] **F-perm-v1.** `/portal/users` → tab Roles & permissions: bật/tắt 1 ô quyền → **refresh trang vẫn giữ** (trước đây mất). Ô của Super Admin vẫn khoá. 
- [ ] **N-3.** Staff → tab Team: danh sách hiện **10 dòng/trang** (trước là 6), phân trang + bộ đếm "1–10 of N" đúng.
- [ ] **H-v2.** Staff có `preferred_name` → Roster grid + Export + `/today` hiện preferred name; Staff Team tab + avatar initials vẫn tên thật; staff không có preferred → fallback `name`; on-call strip cũng hiện preferred.

### ④ Còn phải code

- [ ] **N-1.** Trang leave/balance: thêm **sick leave** riêng bên cạnh annual, fill cho từng staff, request leave trừ vào đúng quỹ. Hiện `staff` **chỉ có `annual` + `taken`**, không có cột nào cho sick. Cần migration (`sick`, `sick_taken`), field trong staff form, và `approveLeave` trừ theo `type` của request. **Mặc định khi không nhập = 0** (lưu ý: seed hiện tại đang để annual = 20 cho 36/38 staff — sẽ đổi default sang 0 theo yêu cầu).
- [ ] **N-2. ⚠️ CẦN DỮ LIỆU CỦA BẠN** — "On leave" của **Candy Tian** hiển thị sai. Root cause đã tìm ra: có **2 nguồn sự thật đá nhau**. `getStaff()` (`lib/data/staff.ts:5-9,26,31`) suy ra on-leave từ `leave_requests` đã duyệt trùng ngày hôm nay, nhưng khi không trúng thì **fallback về cột `staff.status`**. DB hiện có **0 dòng `leave_requests`**, còn Candy Tian lại có `staff.status = 'On leave'` lưu cứng từ seed ⇒ hiện On leave dù không có đơn nghỉ nào. Cần bạn cho biết dữ liệu nghỉ **thực tế** (ai đang nghỉ, từ ngày nào tới ngày nào, loại gì) để nhập vào `leave_requests`, và chốt: cột `staff.status` có nên bỏ hẳn giá trị "On leave" (chỉ còn Active/Inactive) để chỉ còn 1 nguồn sự thật không?
- [ ] **A6.** Admin-gate server-side cho write action CMS (`lib/actions/site-content.ts` chạy dưới session user, RLS hiện authenticated-write theo MVP) — chờ quyết định có siết không.
- [ ] **L.** Roster — gợi ý ca mà staff đó thường làm. ⏳ backlog, chưa chốt.

### Ghi chú còn hiệu lực

- **Luồng D:** Lodge = cột rỗng "—"; đồng hồ tính client (iPad set giờ NZ); band map theo `staff.role` substring (role lạ → band "OTHER"); on-call chỉ track Wesley (giống roster grid).
- **RBAC gap (có sẵn, ngoài scope G):** chưa có nav/route guard theo role cho module nào — `toPortalRole()` gộp 7 role thành `admin|staff`, chỉ 2 mục nav có cờ `adminOnly`, và **không route nào trong `/portal` tự kiểm tra role**. User role hạn chế vẫn vào được mọi trang nếu gõ URL.

---

## Track log / History (mốc đã hoàn thành — không xóa)

Ghi theo ngày, mới nhất trên cùng.

- **2026-07-27** — ✅ **Seed `0004` + `0005` đã chạy** (bạn chạy manual). Verify REST **8/8 pass**: `role_permissions` từ 240 → **308 dòng** (đủ `stock_manager` + module `forms`; `stock_manager` granted đúng 5 ô, `forms` granted đúng 8 ô); `shift_templates` 26 ca → **26 màu riêng**, 0 ca còn mustard `#87651A`, dùng đủ 14 hue family. Đóng **G-v2**, **M-v2**, **J-v3** — hết file SQL chờ.
- **2026-07-27** — ✅ **Luồng K + F-perm + N-3 code xong; palette màu ca được duyệt.**
  - **K — copy lịch tuần trước.** Scope bạn chốt: **cả 2 nút** (toolbar cho cả tuần + ⟲ trên từng dòng staff) và **gộp, không ghi đè** (chỉ thêm ca còn thiếu). `copyPreviousWeek(weekStartISO, staffId?)` (`lib/actions/roster.ts`) đọc tuần trước, dời `shift_date` +7 ngày, rồi `upsert(..., { onConflict: "staff_id,shift_date,shift_id", ignoreDuplicates: true }).select()` — tận dụng đúng unique constraint sẵn có của `roster_shifts`, nên **idempotent** và `.select()` chỉ trả về dòng **thực sự chèn**. Client merge danh sách đó vào `grid` (không `router.refresh()` được vì `grid` là seeded state, chỉ remount khi đổi tuần). Types `RosterCopiedShift`/`RosterCopyResult`. Verify `verify-roster-copy-week.mts` **5/5 PASS trên DB thật** (chèp đúng thứ +7d · chạy lần 2 = 0 dòng · chép đè tuần đã sửa tay = 0 dòng · ô đích giữ cả ca copy lẫn ca sửa tay). Không đổi DB schema.
  - **F-perm — permission matrix thành thật.** Trước đây tab "Roles & permissions" là **UI giả**: state khởi tạo từ `getDefaultPermissions()` (mock), toggle chỉ đổi state in-memory, refresh là mất; **không code nào đọc/ghi `role_permissions`** dù bảng đã tồn tại + seed. Thêm `lib/data/role-permissions.ts::getPermissionMatrix()` (session client, phủ default rồi **overlay** dòng DB lên — giữ matrix *total* để UI index không thủng, và tab vẫn dùng được khi DB chưa seed đủ) + `lib/actions/role-permissions.ts::setRolePermission()` (admin-gated qua `requireAdmin()`, service-role client vì `role_permissions` chỉ có policy select — không có write policy, đúng lý do như `renameUserRole`; chặn sửa `super_admin` cả ở server). UI: toggle optimistic, lỗi thì **hoàn tác ô** và hiện cảnh báo (`permError` dùng chung slot alert với rename).
  - **N-3.** `PAGE_SIZE` của Staff → Team: 6 → **10** (`team-tab.tsx`). Đây là chỗ phân trang **duy nhất** trong portal.
  - **Màu ca (J).** 26 shift template trước chỉ dùng 11 màu, riêng `#87651A` dính **8 ca** → grid nhìn 1 màu. Thêm `scripts/db/emit-shift-template-colors-sql.mts`: palette 14 hue family × 2 biến thể, **tự chặn emit nếu có cặp chữ/nền dưới WCAG AA 4.5:1**, cảnh báo nếu 2 ca trùng màu. Kết quả **26/26 màu riêng**. Đã thử thêm phương án gán màu theo khung giờ (sáng ấm → tối lạnh) nhưng đụng độ 8 chỗ (chỉ còn 18/26) — 26 ca quá nhiều để chia theo buổi, nên chốt `spread`. Bạn duyệt màu ("màu đẹp đó"); SQL ở `supabase/seed/0005_shift_template_colors.sql`, bạn chạy manual.
  - `tsc`/eslint/`next build` sạch toàn repo.

- **2026-07-26** — ✅ **Migration 0016→0024 đã apply hết** (bạn chạy manual). Verify được qua REST/service-role: RPC `today_on_duty` (18 row) + `today_on_call` (1 row) anon gọi được, 4/4 script verify luồng D **PASS**; `verify-roster-on-call-crud` **PASS**; `roles` đủ 7 (có `stock_manager`); `role_groups` = Nurse/HCA/Care Takers/Kitchen, group cũ `nurses_hcas` sạch; `staff_roles` 0 role còn màu default; `staff.preferred_name` OK; `form_templates` + bucket private `form-templates` OK. **2 việc DB còn lại**: (1) `role_permissions` mới 240 row — thiếu module `forms` + role `stock_manager` ⇒ tạo mới `scripts/db/emit-role-permissions-seed-sql.mts` sinh `supabase/seed/0004_role_permissions_seed.sql` (308 row, upsert idempotent, paste vào SQL editor — vì `seed-core-schema.mts` nối `pg` trực tiếp mà password DB stale); (2) các script verify nối `pg` (`verify-app-users-soft-delete`, `verify-roster-on-call-table`, `check-staff-preferred-name-column`) fail `password authentication failed` — cần cập nhật `.env.local`. Dọn section "Luồng I (chưa code)" đã stale (I code xong 2026-07-24).
- **2026-07-24** — ✅ **Luồng M: code xong** module Forms (thư viện biểu mẫu) qua brainstorm → spec → plan → inline cook. Scope: admin-only, thư viện file (giai đoạn 1), Supabase Storage bucket private, category enum cố định 9 loại, chung toàn cơ sở; anchor cho giai đoạn 2 (điền trực tiếp). Thêm module `forms` vào RBAC (admin ALL, còn lại NONE) + nav Administration. Migration `0024_form_templates.sql`. `tsc`/eslint/`next build` sạch. Chưa verify DB/storage (bạn apply 0024 + re-seed — open items M). Spec: [form-templates-library-design.md](../docs/superpowers/specs/2026-07-24-form-templates-library-design.md) · Plan: [form-templates-library.md](../docs/superpowers/plans/2026-07-24-form-templates-library.md).
- **2026-07-22** — ✅ **Luồng H: code xong** preferred name cho Staff (brainstorm → spec → plan → inline cook). Scope: chỉ `staff.preferred_name` (loại `app_users` vì sidebar+bảng Users đọc từ đó, ngoài scope); hiển thị thay hẳn tên ở Roster grid + Duty export + `/today` (kể cả on-call), giữ tên thật + initials ở sidebar/Users/Staff management. Migration `0023_staff_preferred_name.sql` (add column + recreate `today_on_duty`/`today_on_call` coalesce preferred — **supersede 0022**, gộp cả role+building fix của E). Helper client-safe `staffDisplayName()` (`lib/staff-display.ts`); `StaffRecord.preferredName`; form field "Preferred name" + `saveStaff`. Không đổi `dutyStaffOptions` (không caller). `tsc`/eslint/`next build` sạch. Chưa verify DB (chờ bạn apply 0023 — open items H). Spec: [staff-preferred-name-design.md](../docs/superpowers/specs/2026-07-22-staff-preferred-name-design.md) · Plan: [staff-preferred-name.md](../docs/superpowers/plans/2026-07-22-staff-preferred-name.md).
- **2026-07-20** — ✅ **Luồng G: code xong** role tài khoản mới `stock_manager` (yêu cầu qua `/fix`, thực chất là feature — đã hỏi lại phạm vi quyền + tên hiển thị trước khi code). Scope chốt: chỉ `dashboard` (view) + `stock` (CRUD đầy đủ), không quyền module khác; label "Stock Manager", id `stock_manager`. Thêm vào `UserRole` union (`types/domain.ts`), `userRoleMeta` (badge bronze, `design-meta.ts`), `ROLE_KEYS` + `preset.stock_manager` (`mock-data/users.ts`), migration `0019_stock_manager_role.sql` (insert `public.roles`, chưa apply — xem open items G). `role_permissions` không seed qua migration (đúng pattern hiện có — bảng này chỉ seed qua `scripts/db/seed-core-schema.mts` đọc `getDefaultPermissions()`, không migration nào seed nó kể cả 6 role gốc). Không có nav/route guard theo role cho bất kỳ role nào (gap có sẵn, ngoài scope). `tsc --noEmit`/eslint/`next build` sạch toàn repo. Docs: [users-access.md](../docs/features/portal/users-access.md), [03-data-model.md](../docs/03-data-model.md).
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
