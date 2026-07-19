# Today Roster Public Page (`/today`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trang public `/today` — bảng "Today on duty" cho iPad lễ tân: đồng hồ live + nhân viên trực **hôm nay** nhóm theo tòa nhà (Wesley/The Lodge) và band vai trò.

**Architecture:** Anon không đọc trực tiếp `roster_shifts`/`staff` (RLS). Dùng RPC `today_on_duty()` `SECURITY DEFINER` chỉ trả tên/role/giờ/tòa nhà cho **hôm nay theo giờ NZ**. Server component `/today` gọi RPC (anon client), gom thành sheet ở tầng TS (band + 2 cột), render `TodayBoard` — client component chạy đồng hồ 15s.

**Tech Stack:** Next.js 16 (App Router, RSC), `@supabase/ssr` (anon), Postgres RPC (SECURITY DEFINER), Tailwind. Spec: `docs/superpowers/specs/2026-07-20-today-roster-design.md`.

## Global Constraints

- **Anon-safe:** RPC `SECURITY DEFINER`, `set search_path=public`, chỉ SELECT read-only, `grant execute ... to anon, authenticated`. Không lộ email/điện thoại/lương.
- **"Hôm nay" = giờ NZ:** `(now() at time zone 'Pacific/Auckland')::date`.
- **Lodge = option (a):** 2 cột, Lodge rỗng → `—`.
- **Route public:** `/today` trong `(marketing)`; KHÔNG thêm vào middleware matcher.
- **Dùng lại token màu** đã có: `navy-deep`, `bronze-text`, `duty-rule`, `duty-time`, `duty-ink`, `duty-empty`, `duty-foot`, fonts `font-serif`.
- **Comment/tên file không tham chiếu plan/phase.**
- **Git:** KHÔNG tự commit trừ khi được phép; "Commit" = stage sẵn.
- **Verify chạy:** `npx tsx scripts/db/<script>.mts`.

---

### Task 1: RPC `today_on_duty()` + verify anon

**Files:**
- Create: `supabase/migrations/0016_today_on_duty.sql`
- Create (verify): `scripts/db/verify-today-on-duty-rpc.mts`

**Interfaces:**
- Produces: `public.today_on_duty() → table(building_id text, role text, staff_name text, shift_time text)`, execute cho `anon`.

- [ ] **Step 1: Viết verify — gọi RPC bằng ANON key (FAIL trước migration)**

Create `scripts/db/verify-today-on-duty-rpc.mts` (copy header service-role+anon từ `scripts/db/verify-identifier-login.mts`; chỉ cần anon client):

```ts
// ...header: const url = env("NEXT_PUBLIC_SUPABASE_URL")!; const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
import { createClient } from "@supabase/supabase-js";
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await anon.rpc("today_on_duty");
  if (error) throw new Error(`FAIL: anon cannot call today_on_duty: ${error.message}`);
  if (!Array.isArray(data)) throw new Error("FAIL: expected array");
  // Shape check on any returned row (empty is valid on a day with no shifts).
  if (data[0]) {
    for (const k of ["building_id", "role", "staff_name", "shift_time"]) {
      if (!(k in data[0])) throw new Error(`FAIL: missing column ${k}`);
    }
  }
  console.log(`✓ PASS - anon today_on_duty returned ${data.length} row(s)`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
```

- [ ] **Step 2: Chạy verify → FAIL**

Run: `npx tsx scripts/db/verify-today-on-duty-rpc.mts`
Expected: FAIL (`function ... does not exist` hoặc anon bị chặn).

- [ ] **Step 3: Viết migration**

Create `supabase/migrations/0016_today_on_duty.sql`:

```sql
-- Public "today on duty" board data. roster_shifts/staff/shift_templates are RLS
-- and closed to anon; this SECURITY DEFINER function is the only anon-visible
-- surface and returns just what the reception iPad shows: name, role band, shift
-- time, building — for today (Auckland local date) only. No contact/pay data.
create or replace function public.today_on_duty()
returns table (building_id text, role text, staff_name text, shift_time text)
language sql
stable
security definer
set search_path = public
as $$
  select rs.building_id,
         s.role,
         s.name as staff_name,
         coalesce(st.time_label, st.name) as shift_time
  from public.roster_shifts rs
  join public.staff s on s.id = rs.staff_id
  left join public.shift_templates st on st.id = rs.shift_id
  where rs.shift_date = (now() at time zone 'Pacific/Auckland')::date
  order by rs.building_id, s.role, coalesce(st.time_label, st.name);
$$;

grant execute on function public.today_on_duty() to anon, authenticated;
```

- [ ] **Step 4: Áp migration**

Run: `npx tsx scripts/db/apply-migration.mts supabase/migrations/0016_today_on_duty.sql`
Expected: `Applied ...0016_today_on_duty.sql`

- [ ] **Step 5: Chạy verify → PASS**

Run: `npx tsx scripts/db/verify-today-on-duty-rpc.mts`
Expected: `✓ PASS - anon today_on_duty returned N row(s)`

- [ ] **Step 6: (Chẩn đoán) liệt kê giá trị `staff.role` thật để chỉnh mapping band Task 2**

Run (psql): `psql "$DATABASE_URL" -c "select distinct role from public.staff order by 1;"`
Ghi lại danh sách để đối chiếu `bandOf()` ở Task 2 (nếu có role chưa map → rơi vào fallback bucket, vẫn hiển thị đúng nhưng cuối danh sách).

- [ ] **Step 7: Commit (stage sẵn; commit nếu được phép)**

```bash
git add supabase/migrations/0016_today_on_duty.sql scripts/db/verify-today-on-duty-rpc.mts
git commit -m "feat: add anon today_on_duty rpc for public duty board"
```

---

### Task 2: Data fn + gom thành sheet (band + 2 cột)

**Files:**
- Create: `src/lib/data/today-on-duty.ts` (gọi RPC)
- Create: `src/lib/today-board.ts` (pure: rows → `TodayBoardSheet`)
- Modify: `src/types/domain.ts` (thêm `TodayDutyRow`, `TodayBand`, `TodayBoardSheet`)

**Interfaces:**
- Produces:
  - `TodayDutyRow { buildingId: string; role: string; name: string; time: string }`
  - `TodayBand { label: string; wesley: { time: string; name: string }[]; lodge: {...}[] }`
  - `TodayBoardSheet { sections: TodayBand[]; kitchen: { time: string; name: string }[] }`
  - `getTodayOnDuty(): Promise<TodayDutyRow[]>`
  - `buildTodayBoard(rows: TodayDutyRow[]): TodayBoardSheet`

- [ ] **Step 1: Thêm types**

Trong `src/types/domain.ts`, thêm:

```ts
/** One raw row from the today_on_duty RPC. */
export interface TodayDutyRow { buildingId: string; role: string; name: string; time: string; }
/** A role band on the public board, split into per-building columns. */
export interface TodayBand { label: string; wesley: { time: string; name: string }[]; lodge: { time: string; name: string }[]; }
/** The whole public board: role bands + a Kitchen band (Lodge column stays empty). */
export interface TodayBoardSheet { sections: TodayBand[]; kitchen: { time: string; name: string }[]; }
```

- [ ] **Step 2: Data fn gọi RPC**

Create `src/lib/data/today-on-duty.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { TodayDutyRow } from "@/types/domain";

// Public board data via the SECURITY DEFINER rpc (anon-callable). Returns today's
// (Auckland local) on-duty rows: building, role, name, shift time.
export async function getTodayOnDuty(): Promise<TodayDutyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("today_on_duty");
  if (error || !data) return [];
  return (data as { building_id: string; role: string; staff_name: string; shift_time: string }[]).map((r) => ({
    buildingId: r.building_id,
    role: r.role,
    name: r.staff_name,
    time: r.shift_time,
  }));
}
```

- [ ] **Step 3: Pure util gom band + cột**

Create `src/lib/today-board.ts`:

```ts
import type { TodayDutyRow, TodayBand, TodayBoardSheet } from "@/types/domain";

// Display band order for the public board. Each entry matches one or more raw
// staff.role values (case-insensitive substring). Kitchen is handled separately.
const BANDS: { label: string; match: string[] }[] = [
  { label: "NURSE", match: ["nurse", "rn"] },
  { label: "A/C", match: ["a/c", "associate", "charge"] },
  { label: "HCA", match: ["hca", "healthcare", "carer", "care assistant"] },
  { label: "CARE TAKER", match: ["care taker", "caretaker", "ct"] },
];
const KITCHEN = ["kitchen", "chef", "cook", "kit"];

function bandIndex(role: string): number {
  const r = role.toLowerCase();
  for (let i = 0; i < BANDS.length; i++) if (BANDS[i].match.some((m) => r.includes(m))) return i;
  return -1;
}
function isKitchen(role: string): boolean {
  const r = role.toLowerCase();
  return KITCHEN.some((m) => r.includes(m));
}

// A dual-segment shift ("6:45 – 15:15 + 18:00 – 21:00") prints one line per
// segment, matching the design.
function segments(time: string): string[] {
  return String(time).split(" + ");
}

// Group raw rows into the design's bands (Nurse/A-C/HCA/Care Taker) + Kitchen,
// each split into Wesley (left) and Lodge (right) columns. Roles that match no
// band fall into a trailing "OTHER" band so nobody is dropped.
export function buildTodayBoard(rows: TodayDutyRow[]): TodayBoardSheet {
  const sections: TodayBand[] = BANDS.map((b) => ({ label: b.label, wesley: [], lodge: [] }));
  const other: TodayBand = { label: "OTHER", wesley: [], lodge: [] };
  const kitchen: { time: string; name: string }[] = [];

  for (const row of rows) {
    if (isKitchen(row.role)) {
      for (const t of segments(row.time)) kitchen.push({ time: t, name: row.name });
      continue;
    }
    const idx = bandIndex(row.role);
    const band = idx >= 0 ? sections[idx] : other;
    const col = row.buildingId === "lodge" ? band.lodge : band.wesley;
    for (const t of segments(row.time)) col.push({ time: t, name: row.name });
  }

  const out = [...sections, other].filter((b) => b.wesley.length > 0 || b.lodge.length > 0);
  return { sections: out, kitchen };
}
```

- [ ] **Step 4: Kiểm tra biên dịch**

Run: `npx tsc --noEmit`
Expected: sạch (chưa dùng ở page — Task 3).

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/lib/data/today-on-duty.ts src/lib/today-board.ts src/types/domain.ts
git commit -m "feat: add today on-duty data source and board grouping"
```

---

### Task 3: Route `/today` (server component)

**Files:**
- Create: `src/app/(marketing)/today/page.tsx`

**Interfaces:**
- Consumes: `getTodayOnDuty` (Task 2), `buildTodayBoard` (Task 2), `TodayBoard` (Task 4).

- [ ] **Step 1: Viết page**

Create `src/app/(marketing)/today/page.tsx`:

```tsx
import { getTodayOnDuty } from "@/lib/data/today-on-duty";
import { buildTodayBoard } from "@/lib/today-board";
import { TodayBoard } from "@/components/marketing/today-board";

// Public reception-iPad board: today's rostered staff by building. Data is read
// fresh per request via an anon SECURITY DEFINER rpc; the live clock is client-side.
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const rows = await getTodayOnDuty();
  const board = buildTodayBoard(rows);
  return <TodayBoard board={board} />;
}
```

- [ ] **Step 2: Kiểm tra biên dịch**

Run: `npx tsc --noEmit`
Expected: FAIL ở import `TodayBoard` (chưa tạo — Task 4). Ghi nhận, tiếp tục.

- [ ] **Step 3: Commit (stage sẵn; commit nếu được phép)**

```bash
git add "src/app/(marketing)/today/page.tsx"
git commit -m "feat: add public /today route"
```

---

### Task 4: `TodayBoard` client component (đồng hồ live + layout)

**Files:**
- Create: `src/components/marketing/today-board.tsx`

**Interfaces:**
- Consumes: `TodayBoardSheet` (Task 2).

- [ ] **Step 1: Viết component**

Create `src/components/marketing/today-board.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { TodayBoardSheet } from "@/types/domain";

const FULL_DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n: number) => String(n).padStart(2, "0");

function DutyLine({ time, name }: { time: string; name: string }) {
  return (
    <div className="flex items-baseline gap-4 py-[3px]">
      <span className="min-w-[120px] text-[14px] tabular-nums tracking-[0.3px] text-duty-time">{time}</span>
      <span className="text-[15px] font-semibold text-duty-ink">{name.toUpperCase()}</span>
    </div>
  );
}
function DutyColumn({ rows, divider }: { rows: { time: string; name: string }[]; divider?: boolean }) {
  return (
    <div className={divider ? "border-l-[1.5px] border-duty-rule pl-7" : "pr-7"}>
      {rows.length === 0
        ? <div className="text-[14px] text-duty-empty">—</div>
        : rows.map((r, i) => <DutyLine key={`${r.time}-${r.name}-${i}`} time={r.time} name={r.name} />)}
    </div>
  );
}
function BandRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-duty-rule" />
      <span className="text-[13px] font-bold uppercase tracking-[3.5px] text-bronze-text">{label}</span>
      <span className="h-px flex-1 bg-duty-rule" />
    </div>
  );
}

// Public reception board. A live HH:MM clock (15s tick) + full date sit above an
// A4 "duty roster" sheet: role bands split Wesley | The Lodge, then a Kitchen band.
export function TodayBoard({ board }: { board: TodayBoardSheet }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = `${FULL_DOW[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const sheetDate = `${["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][now.getDay()]} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${String(now.getFullYear()).slice(-2)}`;
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div className="bg-[#ECE4D4] px-5 pb-16 pt-[26px]">
      {/* status bar */}
      <div className="mx-auto mb-[22px] flex max-w-[794px] flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-[9px] text-[12px] font-bold uppercase tracking-[1.4px] text-[#2C5A6E]">
          <span className="h-[9px] w-[9px] rounded-full bg-[#6E875E] shadow-[0_0_0_4px_rgba(110,135,94,0.2)]" />
          Live · {dateLabel}
        </div>
        <div className="text-[22px] font-bold tabular-nums tracking-[1px] text-navy-deep">{clock}</div>
      </div>

      {/* A4 sheet */}
      <div className="relative mx-auto flex min-h-[1123px] w-[794px] max-w-full flex-col bg-white px-[60px] pb-[44px] pt-[56px] text-duty-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)]">
        <div className="absolute left-0 top-0 h-[6px] w-full bg-navy-deep" />
        <div className="absolute left-0 top-[6px] h-[2px] w-full bg-bronze-text" />

        <div className="text-center">
          <div className="text-[11.5px] font-semibold uppercase tracking-[5px] text-bronze-text">Victoria at Mt Eden</div>
          <div className="mt-2 font-serif text-[66px] font-medium leading-none tracking-[0.5px] text-navy-deep">Duty Roster</div>
          <div className="mt-2 font-serif text-[17px] italic text-duty-time">Daily staff assignments · {sheetDate}</div>
        </div>

        <div className="mt-[30px] grid grid-cols-2 border-y-2 border-navy-deep py-[13px]">
          <div className="text-center text-[19px] font-bold uppercase tracking-[6px] text-navy-deep">Wesley</div>
          <div className="border-l-[1.5px] border-duty-rule text-center text-[19px] font-bold uppercase tracking-[6px] text-navy-deep">The Lodge</div>
        </div>

        {board.sections.map((sec) => (
          <div key={sec.label} className="mt-6">
            <BandRule label={sec.label} />
            <div className="mt-3 grid grid-cols-2">
              <DutyColumn rows={sec.wesley} />
              <DutyColumn rows={sec.lodge} divider />
            </div>
          </div>
        ))}

        <div className="mt-6">
          <BandRule label="Kitchen" />
          <div className="mt-3 grid grid-cols-2">
            <DutyColumn rows={board.kitchen} />
            <div className="border-l-[1.5px] border-duty-rule pl-7" />
          </div>
        </div>

        <div className="mt-auto pt-7">
          <div className="flex items-center justify-between border-t-2 border-navy-deep pt-[13px]">
            <span className="text-[11px] font-semibold uppercase tracking-[2px] text-duty-foot">Prepared from published roster</span>
            <span className="text-[16px] font-bold tracking-[2px] text-navy-deep">{sheetDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Kiểm tra biên dịch + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: sạch. (Nếu token `text-[#ECE4D4]`/`bg-[#ECE4D4]` cần khai báo — dùng arbitrary value nên không cần.)

- [ ] **Step 3: Kiểm thử thủ công**

Run: `pnpm dev` → mở `http://localhost:3000/today` (KHÔNG đăng nhập):
- Hiển thị đồng hồ HH:MM (đợi ~15s thấy phút cập nhật), ngày đầy đủ.
- Bands Wesley có dữ liệu hôm nay; cột The Lodge hiện `—` (option a).
- Không bị middleware đá về `/login`.

- [ ] **Step 4: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/components/marketing/today-board.tsx
git commit -m "feat: add public today duty board with live clock"
```

---

### Task 5: Verify e2e + docs

**Files:**
- Create (verify): `scripts/db/verify-today-board-e2e.mts`
- Modify: `docs/screen-registry.md`, `docs/features/marketing` (thêm trang `/today`)

- [ ] **Step 1: Verify tổng hợp — seed 1 ca hôm nay rồi gọi RPC anon thấy có dòng**

Create `scripts/db/verify-today-board-e2e.mts` (header service-role + anon): seed 1 staff + 1 `roster_shifts` với `shift_date = NZ today`, gọi anon `today_on_duty`, kỳ vọng có dòng chứa staff đó; cleanup.

```ts
// ...header (admin + anon + env)...
async function main() {
  const nzToday = new Date(new Date().toLocaleString("en-US", { timeZone: "Pacific/Auckland" }));
  const iso = `${nzToday.getFullYear()}-${String(nzToday.getMonth() + 1).padStart(2, "0")}-${String(nzToday.getDate()).padStart(2, "0")}`;
  const NAME = "Verify Today Staff";
  // cleanup any prior
  const prev = await admin.from("staff").select("id").eq("name", NAME);
  for (const s of prev.data ?? []) {
    await admin.from("roster_shifts").delete().eq("staff_id", s.id);
    await admin.from("staff").delete().eq("id", s.id);
  }
  const st = await admin.from("staff").insert({ name: NAME, role: "RN", building_id: "wesley", status: "Active" }).select("id").single();
  const staffId = st.data!.id;
  const tpl = await admin.from("shift_templates").select("id").limit(1).maybeSingle();
  await admin.from("roster_shifts").insert({ staff_id: staffId, building_id: "wesley", shift_date: iso, shift_id: tpl.data?.id ?? "m" });

  const { data, error } = await anon.rpc("today_on_duty");
  if (error) throw new Error(`FAIL: ${error.message}`);
  const hit = (data ?? []).some((r: { staff_name: string }) => r.staff_name === NAME);
  // cleanup
  await admin.from("roster_shifts").delete().eq("staff_id", staffId);
  await admin.from("staff").delete().eq("id", staffId);
  if (!hit) throw new Error("FAIL: seeded today shift not returned by rpc");
  console.log("✓ PASS - today_on_duty returns today's seeded shift to anon");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
```

- [ ] **Step 2: Chạy verify**

Run: `npx tsx scripts/db/verify-today-board-e2e.mts`
Expected: `✓ PASS - today_on_duty returns today's seeded shift to anon`

- [ ] **Step 3: Docs**

- `docs/screen-registry.md`: thêm màn public `/today` (U1, v3.0) — nguồn RPC anon, đồng hồ live.
- `docs/features/marketing`: mô tả trang Today board (data flow, Lodge option a).

- [ ] **Step 4: Kiểm tra cuối**

Run: `npx tsc --noEmit && pnpm lint`
Expected: sạch.

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add scripts/db/verify-today-board-e2e.mts docs/screen-registry.md docs/features/marketing
git commit -m "feat: verify today board e2e and document public today page"
```

---

## Self-review

- **Coverage:** D0 RPC = Task 1; nhóm band/cột = Task 2; route public = Task 3; đồng hồ live + layout = Task 4; verify+docs = Task 5. ✓
- **Anon-safe:** RPC SECURITY DEFINER + grant anon; page dùng anon server client; không đọc bảng RLS trực tiếp. ✓
- **Lodge option (a):** `DutyColumn` render `—` khi rỗng; Kitchen cột Lodge để trống. ✓
- **Type consistency:** `TodayDutyRow`/`TodayBand`/`TodayBoardSheet` khớp giữa data fn, util, component. ✓

## Giả định cần xác nhận

- **Đồng hồ tính client** (giờ máy iPad NZ). Nếu iPad set sai giờ → cân nhắc truyền ngày NZ từ server. (Câu hỏi mở #1 trong spec.)
- **`staff.role` values** map vào band qua `bandOf()` (substring). Task 1 Step 6 liệt kê role thật để chỉnh `BANDS.match` nếu cần; role lạ rơi vào band "OTHER" (không mất dữ liệu).
- **Chấm "Live" tĩnh** như design; thêm pulse nếu muốn (câu hỏi mở #2).
```
