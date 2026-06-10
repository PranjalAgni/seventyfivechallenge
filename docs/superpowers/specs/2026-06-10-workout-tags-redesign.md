# Workout Tags Redesign

## Overview

Replace the current generic bodybuilding-split tags (Push, Pull, Legs, Cardio, Yoga, HIIT, Core, Sport, Other) with a set that reflects the user's actual training (CrossFit, Running, Hyrox) plus broadly useful extras. Tags become multi-select so double-session days can be logged accurately.

---

## Tag List

| Tag | Emoji | Category |
|---|---|---|
| CrossFit | 🏋️ | Primary |
| Running | 🏃 | Primary |
| Hyrox | 🏅 | Primary |
| Strength | 💪 | Extra |
| Cycling | 🚴 | Extra |
| Swim | 🏊 | Extra |
| Yoga | 🧘 | Extra |
| Other | 🔥 | Extra |

8 tags total (down from 9). Removed: Push, Pull, Legs, Core, HIIT, Sport.

---

## Data Model

`workoutType` changes from `WorkoutTag | ''` to `WorkoutTag[]`.

```ts
export type WorkoutTag =
  | 'CrossFit' | 'Running' | 'Hyrox'
  | 'Strength' | 'Cycling' | 'Swim' | 'Yoga' | 'Other';

export const WORKOUT_TAGS: WorkoutTag[] = [
  'CrossFit', 'Running', 'Hyrox',
  'Strength', 'Cycling', 'Swim', 'Yoga', 'Other'
];
```

`DayLog.workoutType` changes from `WorkoutTag | ''` to `WorkoutTag[]`.

### Migration

Old stored data has `workoutType` as a string (or empty string). The store's `parseLog` function must migrate on read:

```ts
// if raw.workoutType is a non-empty string, wrap it in an array
// if raw.workoutType is already an array, use as-is
// if raw.workoutType is '' or undefined, use []
workoutType: Array.isArray(raw.workoutType)
  ? raw.workoutType
  : raw.workoutType
    ? [raw.workoutType]
    : []
```

No write migration needed — arrays serialize fine to localStorage.

---

## WorkoutCard UI

### Tag picker

- Tags render as toggleable pills.
- Tapping a tag adds it to the selection; tapping again removes it.
- Selected state: solid accent colour (`bg-accent-500 text-white`).
- Unselected state: `bg-surface-3 text-text-muted` (same as current).
- No checkmark — highlight only.
- The picker stays open until the user taps elsewhere or the "Done" implicit close (i.e. picker closes when user taps the main card area or the "Change workout type" link re-opens it).

### Card header

- If no tags selected: no pill shown.
- If 1–2 tags: show each as a small pill, e.g. `🏋️ CrossFit` `🏅 Hyrox`.
- If 3+ tags: show first two pills + `+N` badge.

### Subtitle text

- No tags: "Tap below to tag your workout"
- 1 tag: `🏋️ CrossFit day — crushed it`
- 2+ tags: `🏋️ CrossFit · 🏅 Hyrox — crushed it`

### "Change workout type" link

Remains. Tapping re-opens the picker to add/remove tags.

---

## Progress Page

`getWorkoutBreakdown()` iterates `log.workoutType` (now an array). Each tag in a multi-tag session counts once per tag — totals can exceed total workout days. This is expected and correct behaviour.

No change to the function's return type or callers.

---

## Acceptance Criteria

1. Tag list matches the 8 tags above with correct emojis.
2. Multiple tags can be selected on the same day.
3. Old single-string `workoutType` data is read correctly after migration.
4. Card header shows selected tags (with `+N` truncation for 3+).
5. Progress breakdown counts each tag independently for multi-tag sessions.
6. TypeScript compiles with no errors.
