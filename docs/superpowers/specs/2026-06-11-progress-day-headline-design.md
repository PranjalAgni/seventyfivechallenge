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

**After (challenge in progress, today ≥ startDate)**:

```
[Ring: dayNumber / 75 — clamped to 75]
{min(dayNumber, 75)} / 75 days
{max(0, 75 - dayNumber)} days left · {totalComplete} perfect days so far
```

Concrete: on day 45 with 12 perfect days → headline "45 / 75 days," subtitle "30 days left · 12 perfect days so far," ring at 60%.

**After (pre-start, today < startDate)**:

```
[Ring: 0%]
Starts in {N} days
{prettyStartDate}
```

`N` is the integer number of days from today to `startDate` (e.g., today is June 11 and `startDate` is June 15 → "Starts in 4 days"). `prettyStartDate` formats `startDate` as a human-readable month/day (e.g., "June 15"). The perfect-days subtitle is omitted in this state because it's always 0 and adds no information.

---

## Derived Values

Replace the existing `overallPct` (line 6) with derived values that drive both the in-progress and pre-start states:

```ts
const hasStarted = $derived(store.today >= store.settings.startDate);
const dayHeadline = $derived(Math.min(store.dayNumber, 75));
const daysLeft = $derived(Math.max(0, 75 - store.dayNumber));
const ringPct = $derived(hasStarted ? Math.round((dayHeadline / 75) * 100) : 0);
const daysUntilStart = $derived.by(() => {
    if (hasStarted) return 0;
    const start = new Date(store.settings.startDate + 'T12:00:00');
    const today = new Date(store.today + 'T12:00:00');
    return Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
});
const prettyStartDate = $derived(
    new Date(store.settings.startDate + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric'
    })
);
```

`hasStarted` uses string comparison on `YYYY-MM-DD` dates — same approach the calendar already uses ([src/routes/progress/+page.svelte:27-28](../../../src/routes/progress/+page.svelte#L27-L28)).

The header markup branches on `hasStarted`:
- `hasStarted === true`: render the in-progress card (headline `{dayHeadline} / 75 days`, subtitle `{daysLeft} days left · {totalComplete} perfect days so far`, ring at `ringPct`).
- `hasStarted === false`: render the pre-start card (headline `Starts in {daysUntilStart} days`, subtitle `{prettyStartDate}`, ring at 0%).

`overallPct` is only referenced by the ring and can be deleted.

---

## Edge Cases

- **Day 1 (today === startDate)**: `hasStarted` is true (string equality), `dayNumber` is 1. Headline reads "1 / 75 days," subtitle "74 days left · 0 perfect days so far," ring ~1%. Acceptable.
- **Past day 75**: `dayNumber` keeps incrementing (e.g., 80). Clamping `dayHeadline` keeps the headline at "75 / 75 days" and `daysLeft` at 0. Ring at 100%. `totalComplete` in the subtitle is still meaningful (caps naturally at 75).
- **Before challenge starts (today < startDate)**: User picked a future `startDate` during onboarding ([Onboarding.svelte:97-104](../../../src/lib/components/Onboarding.svelte#L97-L104)). `hasStarted` is false; render the pre-start card. The 75-day map below already handles this — every tile renders as `'future'`.
- **Onboarding incomplete**: Handled by [+layout.svelte:11-15](../../../src/routes/+layout.svelte#L11-L15) — the user is gated on the onboarding modal until `name` is set, so they can't reach `/progress` without a `startDate`.

---

## Testing

Manual checks on `/progress`:

1. Default state (start date = today): headline "1 / 75 days," subtitle "74 days left · 0 perfect days so far," ring near zero.
2. Backdate `startDate` in localStorage to ~45 days ago, refresh: headline "45 / 75 days," ring ~60%.
3. Backdate `startDate` to 80 days ago: headline "75 / 75 days," subtitle "0 days left," ring 100% (no overflow, no negative number).
4. Forward-date `startDate` to 4 days in the future: headline "Starts in 4 days," subtitle is the formatted start date (e.g., "June 15"), ring 0%, no perfect-days line shown.
5. Verify the rest of the page is unchanged: 75-day map, Habit Breakdown percentages, Weekly chart, stats grid, Workout Split.

No automated tests in this project today; manual verification matches the existing pattern.

---

## Files Touched

- [src/routes/progress/+page.svelte](../../../src/routes/progress/+page.svelte) — ~6 lines changed in the script block, ~3 lines in the header card markup.
