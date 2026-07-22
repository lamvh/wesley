# Luồng H — Preferred name cho Staff (design)

Ngày: 2026-07-22 · Trạng thái: spec (chưa code)

## Mục tiêu

Cho phép mỗi nhân viên (`staff`) có một **preferred name** — tên muốn được gọi (vd "Bob"
thay cho "Robert Smith"). Nơi hiển thị ca trực dùng preferred name thay tên chính; hồ sơ
quản lý nhân viên giữ tên thật để nhập/sửa.

## Scope (đã chốt qua brainstorm)

| Quyết định | Chốt |
|---|---|
| Entity | **Chỉ `staff`** (không đụng `app_users`) |
| Nơi hiển thị (thay hẳn tên) | **Roster grid**, **Duty export sheet**, **`/today`** |
| KHÔNG áp | Sidebar greeting, bảng Users (`app_users`), Staff management table |
| Format | Thay hẳn: `preferred_name` có → dùng nó; rỗng/null → fallback `name` |
| Avatar initials/màu | **Giữ theo `name` thật** (không tính lại theo preferred) |
| DB | Migrate thật + form CRUD |
| Migration | **Gộp hết vào `0023`** (supersede `0022`) |

**Lý do loại sidebar + bảng Users:** cả 2 đọc từ `app_users` (`portal-identity.ts`,
`user-table.tsx`), không phải `staff`. `staff.user_id` chỉ *optionally* link tới account,
nhiều account (vd Admin) không phải staff. Áp preferred ở đó cần scope `app_users` — ngoài
phạm vi đã chốt.

**Lý do giữ Staff management table theo tên thật:** đó là chỗ canonical để xem/sửa hồ sơ;
form phải hiện `name` thật + field preferred riêng để nhập.

## Data model

Migration mới **`supabase/migrations/0023_staff_preferred_name.sql`** (gộp, idempotent):

1. `alter table public.staff add column if not exists preferred_name text;`
2. `create or replace function public.today_on_duty()` — bản cuối, gồm **cả 3 fix**:
   - role của **ca** (`coalesce(nullif(st.role,''), s.role)`) — từ 0022
   - building của **shift template** (`coalesce(st.building_id, rs.building_id)`) — từ 0022
   - **preferred name**: `staff_name = coalesce(nullif(s.preferred_name,''), s.name)` — mới
3. `grant execute on function public.today_on_duty() to anon, authenticated;`
4. `create or replace function public.today_on_call()` — recreate (từ 0018) đổi
   `s.name` → `coalesce(nullif(s.preferred_name,''), s.name)` để strip On-call ở `/today`
   cũng dùng preferred (nhất quán với on-duty trên cùng màn).
5. `grant execute on function public.today_on_call() to anon, authenticated;`

`0022` được **supersede** bởi `0023` (thân hàm của 0023 là bản cuối gồm hết). Chỉ cần apply
`0023`; không cần apply `0022` riêng. Ghi chú supersede ở đầu file `0022`.

## Code (render-layer — DB giữ tên thật)

### Type + data
- `StaffRecord` (`types/domain.ts`): thêm `preferredName: string`.
- `getStaff()` (`lib/data/staff.ts`): select thêm `preferred_name`; map
  `preferredName: r.preferred_name ?? ""`.

### Helper hiển thị (1 nguồn)
- File mới `src/lib/staff-display.ts` — hàm `staffDisplayName(s: { name: string;
  preferredName: string }): string` → `s.preferredName || s.name`. Chỉ import type, **client-safe**
  (dùng được trong client component `roster-grid.tsx`; không import server client).

### Điểm áp helper
- `roster-view.tsx` — on-call option label (`onCallOptions` line ~107, hiện `s.name`). Đổi này
  lan sang **cả** on-call row trong grid **và** duty sheet OnCallStrip (qua `onCallNameByDay`).
- `roster-grid.tsx` — chip tên staff (`{st.name}` ~168) + `staffName={st.name}` (~182, dùng cho
  picker popover).
- `lib/duty-roster.ts::buildDutySheets` — dòng in `{ time: tm, name: st.name }` (~98).
- `/today`: xử lý **ở RPC** (coalesce ở cả `today_on_duty` + `today_on_call`) → không đổi TS
  (`today-board.ts` đọc `row.name` như cũ).

> `dutyStaffOptions` (`duty-roster.ts:146`) hiện **không có caller** — bỏ qua (YAGNI).

> Sau khi áp helper, mọi chỗ trên đọc preferred; Staff management (`team-tab.tsx`) vẫn đọc
> `s.name` thật (không đổi).

## CRUD (nhập liệu)

- `staff-form.tsx`: thêm 1 `<input name="preferredName">` (optional) ngay dưới field Name,
  label "Preferred name", giá trị mặc định `staff?.preferredName`.
- `saveStaff` (`lib/actions/staff.ts`): thêm `preferred_name: str(fd,"preferredName") || null`
  vào object `fields` (áp cho cả insert & update).
- Không validate độ dài (optional, free-text) — nhất quán với các field text khác của form.
- `initialsOf(name)` giữ nguyên theo `name` (không đổi).

## Docs cần cập nhật (No code before its doc)

- `docs/features/portal/roster-shifts.md` — preferred name ở roster grid + duty export.
- `docs/features/marketing/today-roster.md` — `/today` dùng preferred name (RPC coalesce).
- `docs/03-data-model.md` — cột `staff.preferred_name`.
- Master plan — chuyển H sang done-code + open items verify; ghi 0022 superseded bởi 0023.

## Verify (bạn chạy manual — cùng pattern các luồng khác)

- Apply `0023`. (Không cần 0022 riêng.)
- Seed 1 staff có `preferred_name` → mở `/portal/roster`, Export, `/today`: thấy preferred
  name ở cả 3; Staff Team tab vẫn thấy tên thật.
- Staff không có preferred → vẫn hiện `name` (fallback) ở cả 3.
- Sửa preferred qua staff-form → refresh → 3 màn đổi theo, Staff table + initials không đổi.

## Câu hỏi chưa giải quyết

Không còn — scope đã chốt đủ qua brainstorm.
