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
| H | Preferred name cho Staff/User | ⏳ backlog — chờ quyết định | — |
| I | Roster shift picker — group theo role: Group role → role → shift | ⏳ backlog — chờ quyết định | — |
| K | Roster — copy lịch tuần trước cho từng staff | ⏳ backlog — chờ quyết định | — |
| L | Roster — gợi ý ca mà staff đó thường làm | ⏳ backlog — chờ quyết định | — |

> Các luồng đã done cả code (B, C, D, E, F, G, J) đã gỡ khỏi bảng này — xem **Track log** bên dưới để biết chi tiết.

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

### Luồng H — Preferred name cho Staff/User (⏳ chờ quyết định, chưa code)
- [ ] **H1.** Chốt scope trước khi code: field `preferred_name` (optional) cho `app_users`/`User` — hiển thị ở đâu (bảng Users, header portal, greeting...)? Có validate/độ dài không? Có cần migrate DB (`app_users`) không hay chỉ mock-data trước?
- [ ] **H2.** Sau khi chốt scope ở H1 → tạo spec/plan riêng, brainstorm nếu cần.

### Luồng I — Roster shift picker group theo role (⏳ chờ quyết định, chưa code)
- Ý tưởng: khi pick shift trong roster theo role, tổ chức chọn theo phân cấp **Group role → Role → Shift** (hiện tại roster đã có khái niệm role `groupId` — "Roles & groups", picker chỉ offer shift cho staff cùng group của role, xem `types/domain.ts:355,481-508` — nhưng UI picker hiện tại chưa phải dạng cascading 3 cấp này).
- [ ] **I1.** Chốt scope trước khi code: picker nào cụ thể trong roster cần đổi (grid cell picker chọn staff cho shift, hay ngược lại chọn shift cho staff)? UI cascading (3 dropdown/step) hay 1 dropdown grouped theo section?
- [ ] **I2.** Sau khi chốt scope ở I1 → tạo spec/plan riêng, brainstorm nếu cần.

### Luồng J — Roster: mix màu theo role (bạn chạy manual + test trực quan)
- [x] ✅ **J-code (2026-07-20).** Chốt scope nhanh với bạn: màu áp theo **từng role riêng lẻ** (không phải theo group). Root cause tầng 1: `shift_templates` (bảng "Shift templates") tự lưu `color/tint/border` riêng độc lập với role, đa số dùng màu mặc định gần giống nhau → các ca nhìn na ná nhau, khó phân biệt theo role trên roster grid. Fix: `getRosterShiftTypes()` (`lib/data/roster.ts`) giờ lấy thêm `getRoles()` (bảng `staff_roles`, dùng ở tab "Roles & groups"), map theo `shift.role` để **ghi đè** color/tint/border của chip ca bằng màu của role đó; ca không giới hạn role (`role === ""`) vẫn giữ màu riêng của template. Vì roster grid, picker popover, và duty export sheet đều đọc chung `ShiftType[]` từ `getRosterShiftTypes()` (1 nguồn), fix áp dụng đồng bộ cả 3 nơi. `tsc --noEmit`/eslint/`next build` sạch toàn repo.
- [x] 🐛 **J-code2 (2026-07-20, cùng ngày).** Bạn báo "sao thấy có 1 màu vậy?" sau khi apply J-code — root cause tầng 2: migration `0007_role_groups.sql` bulk-seed role registry (`Carer`, `Registered Nurse`, `Team Leader`, `Activities`, `Care Taker`, `Kitchen`, ...) **không set `color`/`tint`**, nên toàn bộ role rơi vào default cột (`#5B5347`/`#EFE7D7`) — giống hệt nhau. Trong khi role tạo mới qua UI ("Roles & groups" → thêm role) tự động nhận màu riêng qua `paletteFor(name)` (hash tên → 1 trong 8 màu, `lib/actions/roles.ts`) — nhưng các role seed sẵn từ đầu chưa từng qua đường này nên không có màu riêng. Vậy J-code (đổi màu chip theo role) đúng logic, chỉ là **dữ liệu role chưa có màu riêng để đổi theo**. Fix: migration mới `supabase/migrations/0020_backfill_role_colors.sql` — backfill màu cho các role còn đang ở default, gán theo cùng palette 8 màu `saveRole()` dùng, idempotent (chỉ đụng row còn default, chạy lại vô hại). Không đổi code app.
- [x] 🔄 **J-code3 (2026-07-20, cùng ngày).** Bạn đảo ngược J-code: "mỗi ca nên là 1 màu để dễ phân biệt" — không phải theo role. Lý do đúng: shift template seed sẵn (`scripts/db/seed-staff.mts`, sh1–sh6) mỗi ca **đã có màu riêng biệt từ đầu**; J-code (đổi màu theo role) làm **mất** phân biệt đó — vd Carer's Morning/Afternoon/Night trước đó 3 màu khác nhau, sau J-code cả 3 dồn về 1 màu (màu role Carer). Revert `getRosterShiftTypes()` (`lib/data/roster.ts`) về dùng `t.color/t.tint/t.border` gốc của template, bỏ hẳn phần lấy màu theo role. `tsc --noEmit`/eslint/`next build` sạch. Migration `0020_backfill_role_colors.sql` **vẫn giữ nguyên** (không liên quan tới revert này — role vẫn cần màu riêng cho badge/chip ở tab "Roles & groups", chỉ là roster shift chip không dùng màu đó nữa).
- [x] ✅ **J-code4 — tách group "Nurses & HCAs" (2026-07-20, cùng ngày).** Theo yêu cầu: tách group gộp "Nurses & HCAs" thành 2 group riêng **Nurse** và **HCA**. Đã hỏi lại vị trí role "Team Leader" (role thứ 3 trong group cũ cùng Registered Nurse + Carer) → bạn chọn **không xếp Team Leader vào roster group nào cả** (rơi về "Unassigned"). Migration mới `supabase/migrations/0021_split_nurse_hca_groups.sql`: thêm 2 group `nurses` (Nurse) + `hcas` (HCA), dịch `care_takers`/`kitchen` xuống sort_order 2/3; `Registered Nurse` → `nurses`, `Carer` → `hcas`; xoá group cũ `nurses_hcas`. Không đổi code app — chỉ data (roster band tính từ `role_groups`/`staff_roles` qua `groupStaffForRoster()`, đã đọc real-time từ DB).
- [x] 🐛 **J-code5 (2026-07-20, cùng ngày).** Bạn báo lỗi khi chạy `0021`: `null value in column "building_id" of relation "staff_roles" violates not-null constraint` (row `Activity Cordinator`). Root cause: `staff_roles.group_id`'s FK tới `role_groups` là **composite key** `(building_id, group_id) → (building_id, id)`; `ON DELETE SET NULL` trên composite key null **toàn bộ cột trong key**, kể cả `building_id` (đang `NOT NULL`) — không chỉ `group_id` một mình như migration cũ giả định. Ngoài ra còn sót 1 role khác ("Activity Cordinator", có vẻ là role tự thêm/gõ nhầm) vẫn còn trỏ `group_id = 'nurses_hcas'` mà migration cũ chưa reassign (chỉ update Registered Nurse/Carer/Team Leader theo tên). Fix: `0021` giờ có bước catch-all `UPDATE staff_roles SET group_id = null WHERE group_id = 'nurses_hcas'` (bắt mọi role còn sót, không chỉ theo tên) **trước khi** `DELETE` group, tránh trigger cascade lỗi.
- [ ] **J-v1.** Apply cả 2 migration theo thứ tự: `supabase/migrations/0020_backfill_role_colors.sql` rồi `supabase/migrations/0021_split_nurse_hca_groups.sql` (bản đã sửa lỗi).
- [ ] **J-v2.** Test thủ công `/portal/roster`: mỗi ca (chip) có màu riêng biệt dễ phân biệt (không gộp theo role nữa); roster band giờ tách **Nurse** riêng, **HCA** riêng (2 band thay vì 1 "Nurses & HCAs"); Team Leader rơi vào band "Unassigned" ở cuối. Kiểm tra thêm tab Staff → Roles & groups hiển thị đúng 2 group mới.

### Luồng G — Role `stock_manager` (bạn chạy manual)
- [x] ✅ **G-code.** Thêm role tài khoản mới `stock_manager` ("Stock Manager") — chỉ `dashboard` (view) + `stock` (CRUD đầy đủ), không quyền module khác. `UserRole` union (`types/domain.ts`), `userRoleMeta` badge bronze (`design-meta.ts`), `ROLE_KEYS` + `preset.stock_manager` (`mock-data/users.ts`), migration `0019_stock_manager_role.sql` (insert `public.roles`). `tsc`/eslint/`next build` sạch. Docs: [users-access.md](../docs/features/portal/users-access.md), [03-data-model.md](../docs/03-data-model.md).
- [ ] **G-v1.** Apply `supabase/migrations/0019_stock_manager_role.sql`.
- [ ] **G-v2.** Chạy lại `scripts/db/seed-core-schema.mts` để seed `role_permissions` cho `stock_manager` (7×10×4 = 280 dòng).
- [ ] **G-v3.** Test thủ công `/portal/users` → tab Roles & permissions: thấy role card "Stock Manager" (bronze), đúng matrix (dashboard view + stock ALL, còn lại NONE); Add/Edit user role picker có "Stock Manager".
- Lưu ý: chưa có nav/route guard theo role cho module nào (gap có sẵn trước đây, không phải scope của việc này) — user với role này vẫn thấy menu portal đầy đủ, chỉ khác ở permission-matrix mặc định.

---

## Track log / History (mốc đã hoàn thành — không xóa)

Ghi theo ngày, mới nhất trên cùng.

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
