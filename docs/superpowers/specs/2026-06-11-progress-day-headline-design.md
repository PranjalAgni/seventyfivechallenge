# Progress Page — Day-of-Challenge Headline

## Overview

The Progress page header currently reports "perfect days completed / 75" as the primary headline (e.g., "12 / 75 days"). This conflates two different signals — *where you are in the 75-day window* and *how cleanly you've executed it* — and biases the headline toward the smaller, more punishing number. Day 45 of the challenge with 12 perfect days reads as "12 / 75," which feels like the challenge has barely moved.

Switch the headline to **day-of-challenge / 75**. The ring fills steadily as time passes; perfect-days count moves to a subtitle so it stays visible without being the lead number.

---

## Scope

Only [src/routes/progress/+page.svelte](../../../src/routes/progress/+page.svelte). No store changes — `store.dayNumber` and `store.totalComplete` already provide everything needed.

Out of scope:
- 75-Day Map (75 calendar tiles — correct as-is).
- Habit Breakdown `completed/total days` — `total` is already elapsed days ([store.svelte.ts:316-335](../../../src/lib/store.svelte.ts#L316-L335)).
- Weekly Progress chart — rolls up from elapsed days, correct.
- Stats grid (streak, water, workouts) — not days-based.

---

## Header Card — Before / After

**Before** ([src/routes/progress/+page.svelte:90-96](../../../src/routes/progress/+page.svelte#L90-L96)):

```
[Ring: totalComplete / 75]
{totalComplete} / 75 days
{75 - totalComplete} days remaining
```

**After**:

```
[Ring: dayNumber / 75 — clamped to 75]
{min(dayNumber, 75)} / 75 days
{max(0, 75 - dayNumber)} days left · {totalComplete} perfect days so far
```

Concrete: on day 45 with 12 perfect days → headline "45 / 75 days," subtitle "30 days left · 12 perfect days so far," ring at 60%.

---

## Derived Values

Add two `$derived` values in the script block alongside the existing `overallPct`:

```ts
const dayHeadline = $derived(Math.min(store.dayNumber, 75));
const daysLeft = $derived(Math.max(0, 75 - store.dayNumber));
const ringPct = $derived(Math.round((dayHeadline / 75) * 100));
```

Replace the existing `overallPct` (line 6) with `ringPct`. Update the `<ProgressRing>` `percentage` prop, the headline `<p>`, and the subtitle `<p>` accordingly.

`overallPct` is only referenced by the ring, so it can be deleted.

---

## Edge Cases

- **Day 1**: `dayNumber` minimum is 1 ([store.svelte.ts:307](../../../src/lib/store.svelte.ts#L307)). Headline reads "1 / 75 days," subtitle "74 days left · 0 perfect days so far," ring ~1%. Acceptable.
- **Past day 75**: `dayNumber` keeps incrementing (e.g., 80). Clamping `dayHeadline` keeps the headline at "75 / 75 days" and `daysLeft` at 0. Ring at 100%. `totalComplete` in the subtitle is still meaningful (caps naturally at 75).
- **Before challenge starts**: not a real state today — `startDate` defaults to today on first load ([store.svelte.ts:136](../../../src/lib/store.svelte.ts#L136)) and `getDayNumber` returns at least 1. No special handling needed.

---

## Testing

Manual checks on `/progress`:

1. Default state (start date = today): headline "1 / 75 days," subtitle "74 days left · 0 perfect days so far," ring near zero.
2. Backdate `startDate` in localStorage to ~45 days ago, refresh: headline "45 / 75 days," ring ~60%.
3. Backdate `startDate` to 80 days ago: headline "75 / 75 days," subtitle "0 days left," ring 100% (no overflow, no negative number).
4. Verify the rest of the page is unchanged: 75-day map, Habit Breakdown percentages, Weekly chart, stats grid, Workout Split.

No automated tests in this project today; manual verification matches the existing pattern.

---

## Files Touched

- [src/routes/progress/+page.svelte](../../../src/routes/progress/+page.svelte) — ~6 lines changed in the script block, ~3 lines in the header card markup.
