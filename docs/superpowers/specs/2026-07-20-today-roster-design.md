# Today Roster — public `/today` display board (design spec)

**Ngày:** 2026-07-20 · **Luồng:** D (master plan) · **Design nguồn:** Claude Design "Wesley MtEden" `Victoria at Mt Eden.dc.html` (`section=site&sitePage=today`), board `Victoria - Landing.dc.html` frame U1, v3.0.

## Mục tiêu

Trang **public** `/today` — bảng "Today on duty" cho **iPad ở quầy lễ tân**: đồng hồ chạy realtime + danh sách nhân viên **trực hôm nay theo tòa nhà** (Wesley / The Lodge), nhóm theo band vai trò. Không đăng nhập.

## Quyết định đã chốt

- **D0. Nguồn dữ liệu = RPC `today_on_duty()` `SECURITY DEFINER`** cho `anon`. Lý do: `roster_shifts`/`staff`/`shift_templates` đều RLS chặn anon; trang public không dùng anon-select trực tiếp. RPC chỉ lộ bề mặt tối thiểu: tên, band vai trò, giờ ca, tòa nhà — chỉ **hôm nay**.
- **Lodge = phương án (a):** giữ 2 cột, cột The Lodge hiện `—` khi không có dữ liệu (bám design gốc; `roster_shifts` hiện chủ yếu `building_id='wesley'`). *(Giả định — đổi (b) ẩn cột / (c) seed Lodge nếu muốn.)*
- **"Hôm nay" theo giờ NZ:** lọc `shift_date = (now() at time zone 'Pacific/Auckland')::date` (không dùng UTC `current_date`).
- **Route** `/today` nằm trong `(marketing)` (public; middleware chỉ chặn `/portal` + `/login`).

## Layout (từ D1 — đã trích xuất pixel)

- Wrapper nền `#ECE4D4`, sheet "A4" `width:794px; min-height:1123px`, viền trên navy 6px + brass 2px, shadow lớn.
- **Header (trên sheet):** trái = chấm "Live" xanh `#6E875E` (glow ring) + `todayDateLabel` (VD "Monday, 20 July 2026"); phải = đồng hồ `todayClock` `HH:MM` (Instrument Sans, tabular-nums, 22px, `#232A4C`).
- **Masthead:** eyebrow "VICTORIA AT MT EDEN" (letter-spacing 5px, `#B07C22`); title serif Newsreader 66px "Duty Roster"; subtitle italic + ngày.
- **Header 2 cột:** `WESLEY | THE LODGE` (letter-spacing 6px), ruled trên/dưới navy 2px, cột phải có `border-left`.
- **Bands:** NURSE / A/C / HCA / CARE TAKER, rồi **Kitchen** (cột Lodge trống). Mỗi band: label giữa 2 hairline (`#E0D5C0`, `#B07C22`, letter-spacing 3.5px). Mỗi dòng: `{time}` (min-width 120px, tabular, `#8A8172`) + `{name}` in đậm 15px `#22201C`. Cột rỗng → `—` (`#C9C2B3`).
- **Footer:** "Prepared from published roster" + ngày, ruled navy 2px.
- **Fonts:** Newsreader (serif titles) + Instrument Sans (còn lại). Đã có token Tailwind: `navy-deep`, `bronze-text`, `duty-rule`, `duty-time`, `duty-ink`, `duty-empty`, `duty-foot` (dùng lại từ `DutyRosterSheet`).

## Hành vi động

- **Đồng hồ live:** `setInterval 15s` cập nhật `HH:MM` (client component); chỉ chạy trên trang này. `date`/`todayDateLabel` tính từ `new Date()` phía client (hoặc truyền ngày NZ từ server để nhất quán). KHÔNG có highlight "on now"; chấm Live tĩnh (không animation trong design — có thể thêm pulse tùy chọn).
- **Dữ liệu tĩnh trong phiên:** roster hôm nay nạp 1 lần ở server (RPC); không auto-refetch. (Tùy chọn tương lai: revalidate định kỳ.)

## Bề mặt dữ liệu (RPC)

`today_on_duty()` trả về các dòng: `building_id text, role text, staff_name text, shift_time text` cho `shift_date = NZ today`. Nhóm thành band + cột (Wesley/Lodge) ở tầng TS (thứ tự band: Nurse/RN → A/C → HCA/Carer → Care Taker → Kitchen/Chef; fallback bucket cho role lạ). KHÔNG lộ email/điện thoại/lương.

## Ngoài phạm vi

- Persist Lodge roster (option c) — chờ quyết định.
- Auto-refresh dữ liệu roster theo thời gian thực.
- Xác thực/anon rate-limit nâng cao (RPC read-only, dữ liệu không nhạy cảm).

## Câu hỏi mở

1. Đồng hồ + ngày: tính hoàn toàn client (đơn giản) hay truyền ngày NZ từ server để tránh lệch máy iPad? (đề xuất: client, vì iPad lễ tân set giờ NZ).
2. Có cần chấm "Live" nhấp nháy (pulse) không, hay giữ tĩnh như design?
