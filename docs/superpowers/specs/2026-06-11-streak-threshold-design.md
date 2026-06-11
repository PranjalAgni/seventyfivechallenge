# Configurable Streak Threshold + Exclude Today

## Overview

Two changes to how the streak counter behaves:

1. **Threshold** — let users count any day at ≥ N% completion as a streak day, where N is configurable in Settings (default 100, preserving current behavior).
2. **Exclude today** — the streak walk-back starts from yesterday, not today. Today is in progress; counting it (or worse, breaking the streak when today isn't done yet) is misleading.

The streak is rendered in two places: the Progress page "Current Streak" tile and the home-page header (`🔥 N streak`). Both read `store.streak`, so both pick up the new behavior — that's intentional and consistent.

---

## Scope

- [src/lib/store.svelte.ts](../../../src/lib/store.svelte.ts) — settings type + migration v2, new `qualifiesForStreak` helper, updated `getStreak`/`getBestStreak`.
- [src/routes/settings/+page.svelte](../../../src/routes/settings/+page.svelte) — new "Streak" group with a slider for the threshold.

Out of scope:
- `getDayCompletionPct`, `isDayComplete` — unchanged.
- Calendar coloring, weekly chart, habit breakdown — unchanged.
- A second "soft streak" stat — there's one streak number, threshold-driven.
- Showing the threshold value next to the streak tile — the source of truth lives in Settings; no inline hint.

---

## Setting

Add `streakThreshold: number` to `Settings`. Stored as a percentage integer in `[50, 100]`. Default `100` — when a user is on default settings, behavior is unchanged from today (modulo the exclude-today fix).

```ts
export interface Settings {
    _v: number;
    name: string;
    startDate: string;
    streakThreshold: number;  // new
    rules: { ... };
    features: Features;
}
```

**Migration v2** (append-only, per the existing pattern at [store.svelte.ts:40-57](../../../src/lib/store.svelte.ts#L40-L57)):

```ts
2: (data) => ({ ...data, _v: 2, streakThreshold: 100 })
```

Bump `CURRENT_SETTINGS_VERSION` to `2`. Add `streakThreshold: 100` to the `defaultSettings` object in `loadSettings()`.

`updateSettings` already uses `Object.assign(settings, rest)` for top-level fields, so it accepts `streakThreshold` updates without code change.

---

## `qualifiesForStreak(date)`

New private helper inside `createStore()`, used by both `getStreak()` and `getBestStreak()`:

```ts
function qualifiesForStreak(date: string): boolean {
    const threshold = settings.streakThreshold ?? 100;
    if (threshold >= 100) return isDayComplete(date);
    const log = peekLog(date);
    const isSunday = getDayOfWeek(date) === 0;
    const stepProgress = Math.min(1, (log.stepCount || 0) / 10000);
    const count =
        stepProgress +
        (log.water >= 12 ? 1 : 0) +
        (isSunday || log.workout ? 1 : 0) +
        (log.noAlcohol ? 1 : 0) +
        (log.noFriedFood ? 1 : 0);
    const pct = (count / 5) * 100;  // raw, un-capped
    return pct >= threshold;
}
```

Why two paths:
- Threshold = 100 → must use `isDayComplete()` so the existing semantics hold (the "never report 100 unless truly complete" rule, which `getDayCompletionPct` enforces by capping at 99, isn't relevant here because we're using booleans, but routing through `isDayComplete` keeps the strict mode literally identical to today).
- Threshold < 100 → compute the raw pct from the same formula `getDayCompletionPct` uses, but without the 99-cap. The cap exists for *display* reasons; for the threshold check we want the true value.

The 5-habit formula matches [getDayCompletionPct at store.svelte.ts:212-226](../../../src/lib/store.svelte.ts#L212-L226). If that formula ever changes, `qualifiesForStreak` must be updated alongside it.

---

## Exclude Today

Current `getStreak()` ([store.svelte.ts:258-275](../../../src/lib/store.svelte.ts#L258-L275)) starts at `i=0` (today) with three branches: count if complete, skip if empty, break if started-but-incomplete. The third branch is the bug — logging a workout in the morning shouldn't reset the streak to 0 until you finish the rest of today.

**New `getStreak()`**:

```ts
function getStreak(): number {
    let streak = 0;
    const today = new Date();
    for (let i = 1; i <= 75; i++) {  // start at yesterday
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (data[dateStr] && qualifiesForStreak(dateStr)) streak++;
        else break;
    }
    return streak;
}
```

Today is no longer part of the walk. The streak reflects "days you've kept clean leading up to today" — a stable number that only changes at midnight.

**New `getBestStreak()`** — same idea, walk only up to yesterday:

```ts
function getBestStreak(): number {
    const start = settings.startDate;
    if (!start) return 0;
    const startDate = new Date(start + 'T12:00:00');
    const todayDate = new Date(getToday() + 'T12:00:00');
    let best = 0;
    let current = 0;
    const d = new Date(startDate);
    while (d < todayDate) {  // was <=
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (data[dateStr] && qualifiesForStreak(dateStr)) {
            current++;
            if (current > best) best = current;
        } else {
            current = 0;
        }
        d.setDate(d.getDate() + 1);
    }
    return best;
}
```

Also swaps `isDayComplete` for `qualifiesForStreak` so current/best are measured on the same rule.

---

## Settings UI

New card between the existing "Alcohol Rule" card and "Feature Lab" card on [src/routes/settings/+page.svelte](../../../src/routes/settings/+page.svelte). A range slider (50–100, step 1) plus a live label.

```svelte
<!-- Streak Threshold -->
<div class="rounded-2xl bg-surface-2 p-4">
    <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-bold uppercase tracking-wider text-text-dim">Streak Threshold</p>
        <span class="text-sm font-bold text-accent-400">{streakThreshold}%</span>
    </div>
    <p class="mb-3 text-[11px] text-text-muted">
        Count a day toward your streak if completion is at or above this percentage. Leave at 100% for strict mode.
    </p>
    <input
        type="range"
        min="50"
        max="100"
        step="1"
        bind:value={streakThreshold}
        class="w-full accent-accent-500"
    />
</div>
```

Local state additions:
```ts
let streakThreshold = $state(store.settings.streakThreshold);
```

`save()` includes it in the `updateSettings` call:
```ts
store.updateSettings({
    name,
    startDate,
    streakThreshold,
    rules: { ... },
    features
});
```

The slider commits on Save, matching the existing pattern (other fields here also bind locally and commit on Save).

---

## Edge Cases

- **Day 1 of the challenge** — `getStreak()` starts at yesterday, which is before `startDate`. There's no log for yesterday → `data[dateStr]` is falsy → loop breaks immediately → returns 0. Correct: you haven't completed any prior day yet.
- **Threshold of exactly 100** — `qualifiesForStreak` short-circuits to `isDayComplete`. Behavior is identical to pre-change, except today is no longer included.
- **Threshold below 100, missing day in the middle** — a missing day's `data[dateStr]` is falsy → loop breaks. Same semantics as today.
- **Existing user upgrading** — migration v2 adds `streakThreshold: 100`, no change in streak behavior other than excluding today. The exclude-today change can shift their displayed streak on the day of upgrade (e.g., today was being counted, now it isn't); acceptable, the new value is correct.
- **Home header `{#if store.streak > 0 && isToday}`** — still works. With the exclude-today change, day 1 always shows nothing (correct, no streak yet). On day 2+, shows the count of completed prior days.

---

## Testing

Manual checks:

1. **Threshold = 100 (default), no data**: Progress shows `🔥 0`, home header hidden.
2. **Threshold = 100, complete yesterday only, partial today**: Progress shows `🔥 1`, home header shows `🔥 1 streak`. Confirms today's partial state doesn't reset the streak.
3. **Threshold = 100, complete today, nothing yesterday**: Progress shows `🔥 0`. Confirms today doesn't count.
4. **Threshold = 92, yesterday at 92% (4 habits + 6,000 steps)**: Progress shows `🔥 1`.
5. **Threshold = 92, yesterday at 80% (4 habits, 0 steps)**: Progress shows `🔥 0`. Confirms `< threshold` excludes.
6. **Slider in Settings**: drag from 100 → 80 → 100, save, return to Progress, verify streak number reflects each value.
7. **Best streak**: backdate startDate to ~30 days ago with a mix of complete/incomplete days, verify `bestStreak` ≥ `streak` and matches the longest run by hand at threshold 100, then again at threshold 80.
8. **Migration**: with localStorage in `_v: 1` shape (no `streakThreshold`), reload — settings JSON in localStorage should now contain `streakThreshold: 100` and `_v: 2`.

No automated tests in this project today; manual verification matches the existing pattern.

---

## Files Touched

- [src/lib/store.svelte.ts](../../../src/lib/store.svelte.ts) — `Settings` field, migration v2, `defaultSettings`, `qualifiesForStreak`, `getStreak`, `getBestStreak`.
- [src/routes/settings/+page.svelte](../../../src/routes/settings/+page.svelte) — local state, threshold slider card, save call.
