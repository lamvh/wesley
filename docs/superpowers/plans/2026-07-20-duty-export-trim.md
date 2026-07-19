# Duty Export Trim (P4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đồng bộ code với design v2.5: bỏ **On call** + **Chef** khỏi modal *Export duty roster* và tờ in; và fix in single-day thành **đúng 1 trang A4**.

**Architecture:** Tờ duty được dựng từ roster grid thật qua `buildDutySheets`. On-call/chef là dữ liệu thừa (đã bỏ khỏi design) — gỡ khỏi type `DutyForm`/`DutySheet`, khỏi `buildDutySheets`, khỏi component modal + sheet, và khỏi wiring trong `RosterView`. **Giữ nguyên** on-call row của roster GRID (`onCallByDay`/`onCallOptions` — feature riêng, không liên quan bản xuất). Fix in 2 trang: `@media print .duty-sheet` đang `min-height:296mm` sát A4 297mm nên tràn — đổi sang `height:296mm; overflow:hidden`.

**Tech Stack:** Next.js 16 (App Router), React client components, TypeScript, Tailwind, CSS `@media print`.

## Global Constraints

- **Nguồn design:** Claude Design `Victoria at Mt Eden.dc.html` v2.5 (modal chỉ còn *What to export* + *Day*; tờ in không có dòng On call/Chef).
- **Chỉ chạm bản xuất** — KHÔNG động vào on-call row của roster grid (`RosterGrid` props `onCallByDay`/`onCallOptions`/`onOnCall`).
- **Gỡ hẳn code chết** (state/type/compute), không chỉ ẩn UI.
- **Comment/tên file không tham chiếu plan/phase** (quy tắc dự án).
- **Git:** KHÔNG tự commit trừ khi được phép; bước "Commit" = stage sẵn. Conventional commits (`fix:`/`refactor:`).
- **Verify:** `npx tsc --noEmit && pnpm lint` sau mỗi task; kiểm thử in thủ công ở task cuối.

---

### Task 1: Gỡ `onCall`/`chef` khỏi types + `buildDutySheets`

**Files:**
- Modify: `src/types/domain.ts` (`interface DutyForm` ~dòng 379; `interface DutySheet` ~dòng 392)
- Modify: `src/lib/duty-roster.ts` (`DUTY_DEFAULTS` dòng 14; `buildDutySheets` dòng 38–81)

**Interfaces:**
- Produces:
  - `interface DutyForm { scope: "day" | "week"; day: number }`
  - `interface DutySheet { dateLabel: string; sections: DutySection[] }`
  - `buildDutySheets(bands, days, grid, shiftTypes, form): DutySheet[]` — bỏ tham số `onCallByDay`.
  - `DUTY_DEFAULTS: DutyForm = { scope: "week", day: 0 }`.

- [ ] **Step 1: Sửa `DutyForm` — bỏ `onCall`/`chef`**

Trong `src/types/domain.ts`, thay cả block `interface DutyForm`:

```ts
export interface DutyForm {
  scope: "day" | "week";
  /** index into the visible week's days when scope is "day". */
  day: number;
}
```

- [ ] **Step 2: Sửa `DutySheet` — bỏ `onCall`/`chef`**

Trong `src/types/domain.ts`, block `interface DutySheet` (giữ `dateLabel` + `sections`, bỏ 2 dòng `onCall`/`chef`):

```ts
/** One A4 duty sheet (one per day; a whole-week export yields up to seven). */
export interface DutySheet {
  dateLabel: string;
  sections: DutySection[];
}
```

(Nếu block hiện có comment/field khác, chỉ xoá 2 dòng `onCall: string;` và `chef: string;`.)

- [ ] **Step 3: Sửa `DUTY_DEFAULTS` + `buildDutySheets` trong `duty-roster.ts`**

3a. Dòng 14 — `DUTY_DEFAULTS` không còn Omit:

```ts
export const DUTY_DEFAULTS: DutyForm = { scope: "week", day: 0 };
```

3b. Thay cả hàm `buildDutySheets` (bỏ param `onCallByDay`, bỏ `onCall`/`chef` khỏi object trả về; giữ nguyên phần dựng sections):

```ts
// Build one print-ready duty sheet per day in the chosen scope, off the live
// roster: each role band lists the staff assigned that day with their shift
// time. Empty bands are dropped.
export function buildDutySheets(
  bands: RosterBand[],
  days: RosterDay[],
  grid: RosterGrid,
  shiftTypes: ShiftType[],
  form: DutyForm,
): DutySheet[] {
  const defs = Object.fromEntries(shiftTypes.map((s) => [s.id, s]));
  const scopeDays =
    form.scope === "day" ? [days[form.day] ?? days[0]].filter(Boolean) : days;

  return scopeDays.map((day) => ({
    dateLabel: sheetDateLabel(day),
    sections: bands
      .map((band) => {
        const wesley: DutyRow[] = [];
        const lodge: DutyRow[] = [];
        for (const st of band.staff) {
          const ids = grid[rosterCellKey(st.id, day.iso)] ?? [];
          for (const id of ids) {
            const d = defs[id];
            if (!d) continue;
            // A dual-segment shift ("6:45 – 15:15 + 18:00 – 21:00") prints as one
            // line per segment. Each line lands in the column of the shift's
            // building (Lodge right, else Wesley left).
            const col = d.building === "lodge" ? lodge : wesley;
            for (const tm of String(d.time || d.label).split(" + ")) {
              col.push({ time: tm, name: st.name });
            }
          }
        }
        const byStart = (a: DutyRow, b: DutyRow) => startMinutes(a.time) - startMinutes(b.time);
        wesley.sort(byStart);
        lodge.sort(byStart);
        return { label: band.label, wesley, lodge };
      })
      .filter((s) => s.wesley.length > 0 || s.lodge.length > 0),
  }));
}
```

- [ ] **Step 4: Kiểm tra biên dịch (kỳ vọng LỖI ở consumers chưa sửa)**

Run: `npx tsc --noEmit`
Expected: FAIL tại `duty-roster-sheet.tsx` (đọc `sheet.onCall`/`sheet.chef`), `duty-roster-modal.tsx`/`roster-view.tsx` (dùng `form.onCall`/`chef`, `onCallByDay`). Đây là tín hiệu đúng để sửa ở Task 2–3.

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/types/domain.ts src/lib/duty-roster.ts
git commit -m "refactor: drop on-call and chef from duty sheet model"
```

---

### Task 2: Gỡ dải On call/Chef khỏi tờ in `DutyRosterSheet`

**Files:**
- Modify: `src/components/portal/roster/duty-roster-sheet.tsx` (bỏ `DutyMeta` dòng 44–57 + block render dòng 94–97)

**Interfaces:**
- Consumes: `DutySheet` (Task 1) — không còn `onCall`/`chef`.

- [ ] **Step 1: Xoá component `DutyMeta`**

Trong `src/components/portal/roster/duty-roster-sheet.tsx`, xoá toàn bộ block (dòng ~44–57):

```tsx
// One On-call / Chef strip: label · rule · name, boxed on the cream duty strip.
function DutyMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-[14px] rounded-[11px] border border-line bg-duty-strip px-[18px] py-[11px]">
      <span className="text-[12px] font-bold uppercase tracking-[2.5px] text-navy-deep">
        {label}
      </span>
      <span className="h-px flex-1 bg-duty-rule" />
      <span className="text-[15.5px] font-semibold tracking-[0.4px] text-ink">
        {value || "-"}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Xoá block render On call/Chef**

Ngay dưới header toà nhà (Wesley | The Lodge), xoá block (dòng ~94–97):

```tsx
      <div className="mt-4 grid grid-cols-2 gap-[14px]">
        <DutyMeta label="On call" value={sheet.onCall} />
        <DutyMeta label="Chef" value={sheet.chef} />
      </div>
```

(Block kế tiếp `{sheet.sections.length === 0 ? … : …}` giờ nằm ngay sau header toà nhà — khớp design v2.5.)

- [ ] **Step 3: Kiểm tra biên dịch**

Run: `npx tsc --noEmit`
Expected: hết lỗi trong `duty-roster-sheet.tsx` (còn lỗi ở modal/roster-view — sửa ở Task 3).

- [ ] **Step 4: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/components/portal/roster/duty-roster-sheet.tsx
git commit -m "refactor: remove on-call and chef rows from printed duty sheet"
```

---

### Task 3: Gỡ select On call/Chef khỏi modal + wiring trong `RosterView`

**Files:**
- Modify: `src/components/portal/roster/duty-roster-modal.tsx` (props + block select dòng 104–125)
- Modify: `src/components/portal/roster/roster-view.tsx` (dutyForm seed, patchDuty, props modal, imports)

**Interfaces:**
- Produces: `DutyRosterModal` props không còn `staffOptions`, `onOnCall`, `onChef`.

- [ ] **Step 1: Sửa props `DutyRosterModal`**

Trong `src/components/portal/roster/duty-roster-modal.tsx`, thay interface props (bỏ `staffOptions`, `onOnCall`, `onChef`):

```ts
interface DutyRosterModalProps {
  open: boolean;
  form: DutyForm;
  dayOptions: DutyOption[];
  onScope: (scope: DutyForm["scope"]) => void;
  onDay: (day: number) => void;
  onCancel: () => void;
  onGenerate: () => void;
}
```

Và bỏ `staffOptions`, `onOnCall`, `onChef` khỏi danh sách tham số destructure:

```tsx
export function DutyRosterModal({
  open,
  form,
  dayOptions,
  onScope,
  onDay,
  onCancel,
  onGenerate,
}: DutyRosterModalProps) {
```

- [ ] **Step 2: Xoá block grid 2 select On call/Chef**

Xoá nguyên block (dòng ~104–125):

```tsx
          <div className="grid grid-cols-2 gap-[14px]">
            <label className="block">
              <span className={labelCls}>On call</span>
              <select value={form.onCall} onChange={(e) => onOnCall(e.target.value)} className={selectCls}>
                {staffOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Chef</span>
              <select value={form.chef} onChange={(e) => onChef(e.target.value)} className={selectCls}>
                {staffOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
```

(Sau khi xoá, phần thân modal chỉ còn "What to export" + "Day". `DutyOption` vẫn dùng cho `dayOptions`, giữ import.)

- [ ] **Step 3: Sửa `RosterView` — bỏ seed/patch/props on-call+chef của bản xuất**

Trong `src/components/portal/roster/roster-view.tsx`:

3a. Bỏ `dutyStaffOptions` khỏi import `@/lib/duty-roster`:

```ts
import {
  DUTY_DEFAULTS,
  buildDutySheets,
  dutyDayOptions,
  dutySheetTitle,
} from "@/lib/duty-roster";
```

3b. Đổi seed `dutyForm` (dòng ~81–85) — bỏ `onCall`/`chef`:

```tsx
  const [dutyForm, setDutyForm] = useState<DutyForm>({ ...DUTY_DEFAULTS });
```

Và sửa comment ngay trên đó về đúng phạm vi:

```tsx
  // "Export duty roster" flow: config modal -> full-screen A4 print preview.
```

3c. Sửa lời gọi `buildDutySheets` (bỏ `onCallByDay` — vẫn giữ `onCallByDay` state cho GRID):

```tsx
  const dutySheets = useMemo(
    () => buildDutySheets(bands, days, grid, shiftTypes, dutyForm),
    [bands, days, grid, shiftTypes, dutyForm],
  );
```

3d. Xoá dòng `const staffOptions = dutyStaffOptions(staff);` (dòng ~125).

3e. Sửa render `<DutyRosterModal>` (bỏ `staffOptions`, `onOnCall`, `onChef`):

```tsx
      <DutyRosterModal
        open={dutyOpen}
        form={dutyForm}
        dayOptions={dayOptions}
        onScope={(scope) => patchDuty({ scope })}
        onDay={(day) => patchDuty({ day })}
        onCancel={() => setDutyOpen(false)}
        onGenerate={() => {
          setDutyOpen(false);
          setDutyPreview(true);
        }}
      />
```

(GIỮ NGUYÊN `onCallByDay`, `setOnCall`, `onCallOptions` và props `onCallByDay`/`onCallOptions`/`onOnCall` truyền vào `<RosterGrid>` — đó là on-call row của grid, ngoài phạm vi.)

- [ ] **Step 4: Kiểm tra biên dịch + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: sạch (không còn tham chiếu `onCall`/`chef` của bản xuất; `onCallByDay`/`onCallOptions` của grid vẫn còn và hợp lệ).

- [ ] **Step 5: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/components/portal/roster/duty-roster-modal.tsx src/components/portal/roster/roster-view.tsx
git commit -m "refactor: remove on-call and chef fields from export duty modal"
```

---

### Task 4: Fix in single-day thành đúng 1 trang A4

**Files:**
- Modify: `src/app/globals.css` (`@media print` block, `.duty-sheet` dòng ~222–230)

**Interfaces:** không có (chỉ CSS in).

- [ ] **Step 1: Đổi `min-height:296mm` → `height:296mm` + `overflow:hidden`**

Trong `src/app/globals.css`, block `@media print` → `.duty-sheet`, thay:

```css
  .duty-sheet {
    box-shadow: none !important;
    margin: 0 !important;
    width: 210mm !important;
    max-width: none !important;
    min-height: 296mm !important;
    border-radius: 0 !important;
    break-inside: avoid;
  }
```

thành:

```css
  .duty-sheet {
    box-shadow: none !important;
    margin: 0 !important;
    width: 210mm !important;
    max-width: none !important;
    /* Fixed page-box height (just under A4's 297mm) + clip so a single day never
       spills onto a second sheet. Whole-week export still breaks one page/day. */
    height: 296mm !important;
    min-height: 0 !important;
    overflow: hidden !important;
    border-radius: 0 !important;
    break-inside: avoid;
  }
```

- [ ] **Step 2: Kiểm thử in thủ công**

Run: `pnpm dev` → `/portal/roster` → *Export duty roster* → chọn **Single day** → *Generate & preview* → *Print / Save PDF* (hoặc Cmd+P).
Expected: preview in chỉ **1 trang** cho single day (trước đây 2). Whole week: mỗi ngày 1 trang, không có trang trắng thừa.

- [ ] **Step 3: Commit (stage sẵn; commit nếu được phép)**

```bash
git add src/app/globals.css
git commit -m "fix: keep single-day duty sheet on one printed page"
```

---

## Cập nhật tài liệu (sau khi tất cả task xong)

- `docs/screen-registry.md` + `docs/features/portal` (mục Roster/Duty export): ghi bản xuất bỏ On call/Chef (khớp design v2.5) và in 1 trang/ngày. (No code before its doc.)

## Self-review

- **Spec coverage:** E1 (modal) = Task 3; E2 (sheet) = Task 2; E3 (roster-view) = Task 3; E4 (types+buildDutySheets) = Task 1; E5 (print) = Task 4. ✓
- **Giữ grid on-call:** Task 3.3e ghi rõ giữ `onCallByDay`/`onCallOptions`/`onOnCall` cho `RosterGrid`. ✓
- **Type consistency:** `DutyForm`/`DutySheet`/`buildDutySheets` sửa ở Task 1, mọi consumer cập nhật ở Task 2–3; `tsc` gate bắt sót. ✓
```
