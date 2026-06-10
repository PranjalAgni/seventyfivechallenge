# Workout Tags Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic bodybuilding-split workout tags with sport-specific ones (CrossFit, Running, Hyrox + extras) and make tags multi-select so double-session days can be logged accurately.

**Architecture:** The change touches three layers: (1) the store's type definitions and `migrateLog` function for the data model change (`workoutType: string` → `WorkoutTag[]`), (2) `WorkoutCard.svelte` for the multi-select toggle UI, and (3) `getWorkoutBreakdown()` in the store for correct per-tag counting with arrays.

**Tech Stack:** SvelteKit, Svelte 5 runes (`$state`, `$derived`), TypeScript, localStorage persistence.

---

## Files

| Action | File | What changes |
|---|---|---|
| Modify | `src/lib/store.svelte.ts` | `WorkoutTag` type, `WORKOUT_TAGS` array, `DayLog.workoutType` type, `DEFAULT_LOG`, `migrateLog`, `getWorkoutBreakdown` |
| Modify | `src/lib/components/WorkoutCard.svelte` | `selectTag` → `toggleTag`, multi-select pill UI, header pill display |

---

## Task 1: Update types, constants, and default log in the store

**Files:**
- Modify: `src/lib/store.svelte.ts:4-6, 14, 83`

- [ ] **Step 1: Replace the `WorkoutTag` type and `WORKOUT_TAGS` array**

In `src/lib/store.svelte.ts`, replace lines 4–6:

```ts
export type WorkoutTag =
  | 'CrossFit'
  | 'Running'
  | 'Hyrox'
  | 'Strength'
  | 'Cycling'
  | 'Swim'
  | 'Sports'
  | 'Other';

export const WORKOUT_TAGS: WorkoutTag[] = [
  'CrossFit', 'Running', 'Hyrox',
  'Strength', 'Cycling', 'Swim', 'Sports', 'Other'
];
```

- [ ] **Step 2: Update `DayLog.workoutType` field type**

In the `DayLog` interface (line 14), change:

```ts
// Before
workoutType: WorkoutTag | '';

// After
workoutType: WorkoutTag[];
```

- [ ] **Step 3: Update `DEFAULT_LOG`**

In `DEFAULT_LOG` (line 83), change:

```ts
// Before
workoutType: '',

// After
workoutType: [],
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/pranjal.agnihotri/coding/Svelte/seventyfivechallenge
npx tsc --noEmit
```

Expected: errors about `migrateLog` and `WorkoutCard` (we haven't updated those yet) — that's fine at this stage. No errors on the type/constant definitions themselves.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store.svelte.ts
git commit -m "refactor: update WorkoutTag type and WORKOUT_TAGS to new sport-specific list"
```

---

## Task 2: Migrate stored data on read

**Files:**
- Modify: `src/lib/store.svelte.ts:89-101` (`migrateLog`)

- [ ] **Step 1: Update `migrateLog` to handle the string→array migration**

Replace the `workoutType` line inside `migrateLog` (currently `workoutType: raw.workoutType ?? ''`):

```ts
function migrateLog(raw: any): DayLog {
  return {
    date: raw.date ?? '',
    steps: raw.steps ?? false,
    stepCount: raw.stepCount ?? 0,
    water: raw.water ?? 0,
    workout: raw.workout ?? false,
    workoutType: Array.isArray(raw.workoutType)
      ? raw.workoutType
      : raw.workoutType
        ? [raw.workoutType as WorkoutTag]
        : [],
    noAlcohol: raw.noAlcohol ?? true,
    noFriedFood: raw.noFriedFood ?? true,
    notes: raw.notes ?? ''
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly for the store**

```bash
npx tsc --noEmit 2>&1 | grep "store.svelte"
```

Expected: no errors on `store.svelte.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/store.svelte.ts
git commit -m "feat: migrate workoutType from string to WorkoutTag[] on localStorage read"
```

---

## Task 3: Update `getWorkoutBreakdown` for arrays

**Files:**
- Modify: `src/lib/store.svelte.ts:367-377` (`getWorkoutBreakdown`)

- [ ] **Step 1: Update the function to iterate over the array**

Replace `getWorkoutBreakdown` (currently iterates `log.workoutType` as a string):

```ts
function getWorkoutBreakdown(): { tag: WorkoutTag; count: number }[] {
  const counts: Record<string, number> = {};
  for (const log of Object.values(data)) {
    if (log.workout && log.workoutType.length > 0) {
      for (const tag of log.workoutType) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag: tag as WorkoutTag, count }))
    .sort((a, b) => b.count - a.count);
}
```

Note: the return type drops `| 'Rest'` — that was never actually used in the old code.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "store.svelte"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/store.svelte.ts
git commit -m "feat: update getWorkoutBreakdown to count each tag in multi-tag sessions"
```

---

## Task 4: Update WorkoutCard — multi-select toggle logic

**Files:**
- Modify: `src/lib/components/WorkoutCard.svelte`

- [ ] **Step 1: Replace the script block**

Replace the entire `<script>` block in `WorkoutCard.svelte`:

```ts
<script lang="ts">
  import { store, WORKOUT_TAGS, type WorkoutTag } from '$lib/store.svelte';

  interface Props {
    date: string;
  }

  let { date }: Props = $props();

  const log = $derived(store.peekLog(date));
  const isSunday = $derived(store.getDayOfWeek(date) === 0);
  const checked = $derived(log.workout);
  let showTags = $state(false);

  function toggle() {
    if (isSunday) return;
    const newVal = !checked;
    store.updateLog(date, { workout: newVal });
    if (newVal && log.workoutType.length === 0) {
      showTags = true;
    }
    if (!newVal) {
      store.updateLog(date, { workoutType: [] });
      showTags = false;
    }
  }

  function toggleTag(tag: WorkoutTag) {
    const current = log.workoutType;
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    store.updateLog(date, { workoutType: next, workout: true });
  }

  const tagEmojis: Record<WorkoutTag, string> = {
    CrossFit: '🏋️',
    Running: '🏃',
    Hyrox: '🏅',
    Strength: '💪',
    Cycling: '🚴',
    Swim: '🏊',
    Sports: '🏸',
    Other: '🔥'
  };

  const selectedLabel = $derived.by(() => {
    const tags = log.workoutType;
    if (tags.length === 0) return '';
    if (tags.length <= 2) return tags.map((t) => `${tagEmojis[t]} ${t}`).join(' · ');
    return `${tagEmojis[tags[0]]} ${tags[0]} · ${tagEmojis[tags[1]]} ${tags[1]} +${tags.length - 2}`;
  });
</script>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "WorkoutCard"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/WorkoutCard.svelte
git commit -m "refactor: replace selectTag with toggleTag for multi-select workout tags"
```

---

## Task 5: Update WorkoutCard — template

**Files:**
- Modify: `src/lib/components/WorkoutCard.svelte` (template section)

- [ ] **Step 1: Update the card header subtitle**

Replace the subtitle `<p>` block (currently lines 61–70):

```svelte
<p class="text-xs text-text-muted">
  {#if isSunday}
    Rest day — you've earned it!
  {:else if checked && log.workoutType.length > 0}
    {selectedLabel} — crushed it
  {:else if checked}
    Tap below to tag your workout
  {:else}
    Push yourself today
  {/if}
</p>
```

- [ ] **Step 2: Update the header pill**

Replace the `{#if log.workoutType}` pill block (currently lines 55–58) to use the array:

```svelte
{#if log.workoutType.length > 0}
  <span class="rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-bold text-accent-400">
    {log.workoutType.length === 1
      ? log.workoutType[0]
      : log.workoutType.length === 2
        ? log.workoutType.join(' · ')
        : `${log.workoutType[0]} +${log.workoutType.length - 1}`}
  </span>
{/if}
```

- [ ] **Step 3: Update the tag picker — multi-select toggle style**

Replace the `{#each WORKOUT_TAGS as tag}` loop (currently lines 87–96):

```svelte
{#each WORKOUT_TAGS as tag}
  <button
    onclick={() => toggleTag(tag)}
    class="rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95
      {log.workoutType.includes(tag)
        ? 'bg-accent-500 text-white shadow-sm shadow-accent-500/25'
        : 'bg-surface-3 text-text-muted'}"
  >
    {tagEmojis[tag]} {tag}
  </button>
{/each}
```

- [ ] **Step 4: Update the "tag your workout" conditional**

The tag picker show condition (line 83) checks `!log.workoutType` — update to array:

```svelte
{#if (showTags || (checked && log.workoutType.length === 0)) && !isSunday}
```

- [ ] **Step 5: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/WorkoutCard.svelte
git commit -m "feat: multi-select workout tag UI with new sport-specific tags"
```

---

## Task 6: Smoke test in the browser

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:5173`.

- [ ] **Step 2: Test new tag list**

On Today's page, mark the workout as done. Verify the tag picker shows:
`🏋️ CrossFit`, `🏃 Running`, `🏅 Hyrox`, `💪 Strength`, `🚴 Cycling`, `🏊 Swim`, `🏸 Sports`, `🔥 Other`

- [ ] **Step 3: Test multi-select**

Select `CrossFit` then `Hyrox`. Verify:
- Both pills are accent-coloured.
- Card header shows `CrossFit · Hyrox`.
- Subtitle shows `🏋️ CrossFit · 🏅 Hyrox — crushed it`.

- [ ] **Step 4: Test deselect**

Tap `CrossFit` again. Verify it deselects (goes grey) while `Hyrox` stays selected.

- [ ] **Step 5: Test +N truncation**

Select 3+ tags. Verify header pill shows e.g. `CrossFit +2`.

- [ ] **Step 6: Test migration (old data)**

In browser DevTools console, manually set an old-format entry and reload:

```js
const data = JSON.parse(localStorage.getItem('75medium_data') || '{}');
const today = new Date().toISOString().split('T')[0];
data[today] = { ...data[today], workoutType: 'Cardio', workout: true };
localStorage.setItem('75medium_data', JSON.stringify(data));
location.reload();
```

Verify the workout card shows `Other` selected (old `Cardio` tag no longer exists, but `workoutType` is a valid array `['Cardio']` — it won't crash, the tag just won't match any known tag so nothing appears selected, which is acceptable).

- [ ] **Step 7: Check Progress page workout split**

Navigate to `/progress`. Verify the Workout Split section shows counts per tag name (not per old tag name).

- [ ] **Step 8: Final commit if everything looks good**

```bash
git add -p  # review any lingering unstaged hunks
git commit -m "chore: verify multi-select workout tags working in browser"
```

---

## Acceptance Criteria Checklist

- [ ] Tag list: CrossFit 🏋️, Running 🏃, Hyrox 🏅, Strength 💪, Cycling 🚴, Swim 🏊, Sports 🏸, Other 🔥
- [ ] Multiple tags selectable on same day
- [ ] Old string `workoutType` read without crash (migrated to array)
- [ ] Card header pill shows selected tags with `+N` for 3+
- [ ] Progress breakdown counts each tag independently for multi-tag sessions
- [ ] TypeScript compiles with 0 errors
