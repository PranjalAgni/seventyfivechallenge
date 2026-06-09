# Heatmap Tile Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking a past or today tile in the 75-day heatmap navigates to the Today tab with that day pre-selected.

**Architecture:** The Progress page calls SvelteKit's `goto('/?date=<dateStr>')` when a past/today tile is clicked. The Today page reads the `?date` search param on navigation, validates it, sets `selectedDate`, then cleans the URL with `replaceState`.

**Tech Stack:** SvelteKit, Svelte 5 (`$state`, `$effect`), `$app/navigation` (`goto`, `replaceState`), `$app/state` (`page`)

---

## File Map

- **Modify:** `src/routes/progress/+page.svelte` — make past/today heatmap tiles interactive with click handler and hover styles
- **Modify:** `src/routes/+page.svelte` — read `?date` param on mount, validate, set `selectedDate`, clean URL

---

### Task 1: Make heatmap tiles navigable (Progress page)

**Files:**
- Modify: `src/routes/progress/+page.svelte`

The heatmap grid currently renders each tile as a plain `<div>`. We need to:
1. Import `goto` from `$app/navigation`
2. Add a click handler that calls `goto('/?date=<day.date>')` for non-future tiles
3. Add `cursor-pointer` and hover styles to interactive tiles

- [ ] **Step 1: Add `goto` import**

At the top of the `<script lang="ts">` block in `src/routes/progress/+page.svelte`, add:

```ts
import { goto } from '$app/navigation';
```

The existing imports start at line 1:
```ts
import { store } from '$lib/store.svelte';
import ProgressRing from '$lib/components/ProgressRing.svelte';
```

After adding:
```ts
import { store } from '$lib/store.svelte';
import ProgressRing from '$lib/components/ProgressRing.svelte';
import { goto } from '$app/navigation';
```

- [ ] **Step 2: Add click handler function**

After the `getHeatmapClass` function (around line 50), add:

```ts
function handleTileClick(day: CalendarDay) {
    if (day.status === 'future') return;
    goto(`/?date=${day.date}`);
}
```

- [ ] **Step 3: Update the tile div with click handler and interactive styles**

Find the tile `<div>` inside the `{#each calendarDays as day}` loop (around line 222). It currently looks like:

```svelte
<div
    class="relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-bold transition-all
    {calendarShowCompletion
        ? getHeatmapClass(day)
        : day.status === 'complete'
            ? 'bg-mint-500 text-white shadow-sm shadow-mint-500/20'
            : day.status === 'incomplete'
                ? 'bg-rose-500/50 text-white'
                : day.status === 'today'
                    ? 'bg-accent-500 text-white ring-2 ring-accent-300 shadow-lg shadow-accent-500/30'
                    : 'bg-surface-3 text-text-dim'}"
    title="Day {day.dayNum} - {day.date}"
>
```

Replace it with:

```svelte
<div
    class="relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-bold transition-all
    {day.status !== 'future' ? 'cursor-pointer hover:scale-110 hover:brightness-110' : ''}
    {calendarShowCompletion
        ? getHeatmapClass(day)
        : day.status === 'complete'
            ? 'bg-mint-500 text-white shadow-sm shadow-mint-500/20'
            : day.status === 'incomplete'
                ? 'bg-rose-500/50 text-white'
                : day.status === 'today'
                    ? 'bg-accent-500 text-white ring-2 ring-accent-300 shadow-lg shadow-accent-500/30'
                    : 'bg-surface-3 text-text-dim'}"
    title="Day {day.dayNum} - {day.date}"
    role={day.status !== 'future' ? 'button' : undefined}
    tabindex={day.status !== 'future' ? 0 : undefined}
    onclick={() => handleTileClick(day)}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTileClick(day); }}
>
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/progress/+page.svelte
git commit -m "feat: make heatmap tiles clickable for past/today days"
```

---

### Task 2: Read date param on Today page and pre-select the day

**Files:**
- Modify: `src/routes/+page.svelte`

The Today page initialises `selectedDate` to `store.today`. We need it to:
1. Import `page` from `$app/state` (already imported? — check: it's NOT imported currently)
2. Import `replaceState` from `$app/navigation`
3. In a `$effect`, read `page.url.searchParams.get('date')`, validate, set `selectedDate`, clean URL

- [ ] **Step 1: Add missing imports**

At the top of `<script lang="ts">` in `src/routes/+page.svelte`, the current imports are:

```ts
import { store } from '$lib/store.svelte';
import ProgressRing from '$lib/components/ProgressRing.svelte';
import WaterTracker from '$lib/components/WaterTracker.svelte';
import HabitCard from '$lib/components/HabitCard.svelte';
import AlcoholCard from '$lib/components/AlcoholCard.svelte';
import StepTracker from '$lib/components/StepTracker.svelte';
import WorkoutCard from '$lib/components/WorkoutCard.svelte';
import JournalEntry from '$lib/components/JournalEntry.svelte';
import DateSwitcher from '$lib/components/DateSwitcher.svelte';
```

Add two imports:

```ts
import { store } from '$lib/store.svelte';
import ProgressRing from '$lib/components/ProgressRing.svelte';
import WaterTracker from '$lib/components/WaterTracker.svelte';
import HabitCard from '$lib/components/HabitCard.svelte';
import AlcoholCard from '$lib/components/AlcoholCard.svelte';
import StepTracker from '$lib/components/StepTracker.svelte';
import WorkoutCard from '$lib/components/WorkoutCard.svelte';
import JournalEntry from '$lib/components/JournalEntry.svelte';
import DateSwitcher from '$lib/components/DateSwitcher.svelte';
import { page } from '$app/state';
import { replaceState } from '$app/navigation';
```

- [ ] **Step 2: Add date-param effect**

After the line `let selectedDate = $state(store.today);` (line 12), add:

```ts
$effect(() => {
    const dateParam = page.url.searchParams.get('date');
    if (!dateParam) return;
    // Validate YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        replaceState('/', {});
        return;
    }
    // Only allow dates within the challenge range (startDate..today)
    const start = store.settings.startDate;
    if (start && dateParam >= start && dateParam <= store.today) {
        selectedDate = dateParam;
    }
    replaceState('/', {});
});
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: read ?date param on Today page to pre-select heatmap navigation target"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the app in the browser at `http://localhost:5173`.

- [ ] **Step 2: Navigate to the Progress tab and verify tile interaction**

- Tap a **past** tile → should navigate to Today tab showing that day's data (DateSwitcher shows the correct day, progress ring reflects that day)
- Tap the **today** tile → should navigate to Today tab showing today (no banner, normal state)
- Tap a **future** tile → nothing should happen, no cursor change
- After navigation, the URL bar should show `/` (not `/?date=...`)

- [ ] **Step 3: Verify fallback behaviour**

Manually visit `http://localhost:5173/?date=invalid` → should land on today's data.
Manually visit `http://localhost:5173/?date=1990-01-01` → should land on today's data (out of range).

- [ ] **Step 4: Commit (if any fixes were needed)**

```bash
git add -p
git commit -m "fix: correct heatmap navigation edge cases"
```
