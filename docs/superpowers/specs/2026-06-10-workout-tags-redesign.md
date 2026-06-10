# Workout Tags Redesign

## Overview

Replace the current generic bodybuilding-split tags (Push, Pull, Legs, Cardio, HIIT, Core, Other) with a set that reflects the user's actual training (CrossFit, Running, Hyrox) plus broadly useful extras. Tags become multi-select so double-session days can be logged accurately.

---

## Tag List

| Tag      | Emoji | Category |
| -------- | ----- | -------- |
| CrossFit | 🏋️    | Primary  |
| Running  | 🏃    | Primary  |
| Hyrox    | 🏅    | Primary  |
| Strength | 💪    | Extra    |
| Cycling  | 🚴    | Extra    |
| Swim     | 🏊    | Extra    |
| Sports   | 🏸    | Extra    |
| Other    | 🔥    | Extra    |

8 tags total (down from 9). Removed: Push, Pull, Legs, Core, HIIT

---

## Data Model

`workoutType` changes from `WorkoutTag | ''` to `WorkoutTag[]`.

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
  'CrossFit',
  'Running',
  'Hyrox',
  'Strength',
  'Cycling',
  'Swim',
  'Sports',
  'Other',
];
```

`DayLog.workoutType` changes from `WorkoutTag | ''` to `WorkoutTag[]`.

### Migration

Old stored data has `workoutType` as a string (or empty string). The store's `migrateLog` function must handle two things on read:

1. **String → array**: wrap the value in an array.
2. **Old tag → new tag**: remap removed tags to their closest equivalent.

Tag remapping table:

| Old | New |
|---|---|
| Push | Strength |
| Pull | Strength |
| Legs | Strength |
| Core | Strength |
| HIIT | CrossFit |
| Cardio | Running |
| Yoga | Other |
| Sport | Sports |

```ts
const TAG_REMAP: Record<string, WorkoutTag> = {
  Push: 'Strength', Pull: 'Strength', Legs: 'Strength', Core: 'Strength',
  HIIT: 'CrossFit', Cardio: 'Running', Yoga: 'Other', Sport: 'Sports'
};

function remapTag(tag: string): WorkoutTag {
  return TAG_REMAP[tag] ?? (WORKOUT_TAGS.includes(tag as WorkoutTag) ? tag as WorkoutTag : 'Other');
}

// in migrateLog:
workoutType: Array.isArray(raw.workoutType)
  ? raw.workoutType.map(remapTag)
  : raw.workoutType
    ? [remapTag(raw.workoutType)]
    : []
```

No write migration needed — arrays serialize fine to localStorage. The remap runs at read time on every load until all entries have been re-saved with new values.

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
