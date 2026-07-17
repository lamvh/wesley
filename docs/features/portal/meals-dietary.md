# Meals & dietary

- **Route:** `/portal/meals` - `app/portal/meals/page.tsx`
- **Section:** Portal · **Access:** both
- **Source:** lines `911–938` (markup); data `1309–1333`
- **Render:** RSC (+ client islands: none - Print button inert)

## Purpose
Today's kitchen sheet: the three meal services with menu items and prep notes, plus a roll-up of dietary requirements across residents. Used by kitchen/care staff and admin to see what's served and how many special diets to prepare.

## Layout
Centered column (`max-width:1180px`). Top-to-bottom:
1. Header row - title + date subline left, `Print kitchen sheet` button right.
2. Three-column meal grid (`grid-template-columns:repeat(3,1fr)`, gap `16px`, `margin-top:22px`).
3. Full-width "Dietary requirements today" card with a 5-tile count grid (`margin-top:16px`).

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header (title, date, print) | `meals-header` | Title `Meals & dietary` (Newsreader 32px); subline `Today's menu · Saturday, 11 July`; `Print kitchen sheet` = accent primary button |
| Meal cards (3) | `meal-card` | One per service. Card = cream-2 + border, radius `16px`. Tinted header (`m.bg`) with eyebrow `meal` (uppercase, `m.accent` colour) + `time`. Body lists item rows. |
| Item row (within card) | `meal-item-row` | `name` (14.5px semibold) + `note` (meta). Divider between rows (`border-2`). |
| Dietary requirements card | `diet-summary-card` | Title `Dietary requirements today` (Newsreader 20px), holds the count-tile grid. |
| Diet count tile (5) | `diet-count-tile` | Cream tile, `field`-border, centered. Big Newsreader `count` (30px, navy) over `label`. |

Grid columns: meals `repeat(3,1fr)`; diet tiles `repeat(5,1fr)`.

## Data consumed
From `lib/mock-data/meals.ts` (see 03-data-model.md):
- `getMeals()` → `MealService[]`. Fields used: `meal` (`Breakfast`|`Lunch`|`Dinner`), `time`, `items[]` → `{ name, note }`. Header wash `bg` + eyebrow `accent` are presentation values derived per meal (breakfast amber `#F3EEE0`/`#b0894a`, lunch sage `#EEF2E7`/`#2C3563`, dinner terracotta `#F4EBE4`/`#BE7350`), keyed in accessor/helper - not stored as raw domain data.
- `diets` (`getDiets()`) → `DietCount[]`: `label` (`Soft / puree`, `Diabetic`, `Gluten free`, `Vegetarian`, `Thickened`), `count`.

## Variants & states
- **Role:** identical for admin and staff (access `both`); no role-gated content.
- **Per-meal styling:** each card's header tint + eyebrow colour vary by meal service (three fixed tones).
- **Empty state:** a meal with no `items` would render an empty card body - not exercised (all three meals have items); a diet with `count:0` would still show the tile with `0`.
- No status/severity styling here - meal cards are informational, not status-driven.

## Interactions
- `Print kitchen sheet` - inert stub (would trigger `window.print()` / a print layout). No-op this phase.
- No navigation off this screen; no clickable rows.

## Tokens
- Surfaces: cream-2 card + `border`; diet tiles on `cream` with `field`/`border-2` edge.
- Meal header tints + eyebrow colours: fixed per-meal wash tones (amber / sage / terracotta families) - applied via a meal-presentation helper, referenced by name, not hardcoded per JSX node.
- Type: Newsreader for title, card eyebrow-adjacent headings, and the display `count` numbers; Instrument Sans for item names, notes, labels, eyebrow (uppercase `letter-spacing:1px`).
- Radius: cards `16px`, tiles `12px`.

## Out of scope (this phase)
Present visually but inert: `Print kitchen sheet`. No real print sheet, no menu editing, no diet-count recomputation from residents (counts are static mock values).

## Definition of Done
- Three meal cards render Breakfast / Lunch / Dinner with correct tinted headers, times, and item+note rows from `getMeals()`.
- Dietary card shows all five count tiles with correct numbers/labels from `diets`.
- No raw hex in JSX; meal header tones via helper. Global DoD (00-rules §11) met.
