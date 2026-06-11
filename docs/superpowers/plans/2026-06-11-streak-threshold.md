# Configurable Streak Threshold + Exclude Today Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the streak counter configurable (count days at ≥ N% completion, default 100%) and stop counting today (which is still in progress) toward the streak.

**Architecture:** Two-file change. In [src/lib/store.svelte.ts](../../../src/lib/store.svelte.ts): bump settings to v2 with a new `streakThreshold` field, add a `qualifiesForStreak(date)` helper that routes to `isDayComplete` at threshold 100 and computes raw pct otherwise, and update `getStreak`/`getBestStreak` to use it and to exclude today. In [src/routes/settings/+page.svelte](../../../src/routes/settings/+page.svelte): add a slider card. Both `store.streak` consumers (Progress page tile, home header) pick up the new behavior automatically — no changes needed there.

**Tech Stack:** Svelte 5 (`$state`, `$derived`), SvelteKit, TypeScript, localStorage with versioned migrations.

**Spec:** [docs/superpowers/specs/2026-06-11-streak-threshold-design.md](../specs/2026-06-11-streak-threshold-design.md)

---

## File Map

- **Modify:** [src/lib/store.svelte.ts](../../../src/lib/store.svelte.ts) — `Settings` interface, `CURRENT_SETTINGS_VERSION`, `migrations` map, `defaultSettings` literal, new `qualifiesForStreak` helper, `getStreak`, `getBestStreak`.
- **Modify:** [src/routes/settings/+page.svelte](../../../src/routes/settings/+page.svelte) — local `streakThreshold` state, new slider card, include in `save()`.

This project does not have an automated test suite — verification is manual via the dev server and DevTools localStorage inspection.

---

### Task 1: Add `streakThreshold` to settings type, migration, defaults

**Files:**
- Modify: `src/lib/store.svelte.ts:24-35` (Settings interface)
- Modify: `src/lib/store.svelte.ts:37` (CURRENT_SETTINGS_VERSION)
- Modify: `src/lib/store.svelte.ts:40-57` (migrations map)
- Modify: `src/lib/store.svelte.ts:132-141` (defaultSettings literal in loadSettings)

The settings store has a versioned migration system. We bump from v1 → v2, adding `streakThreshold: 100` so existing users keep current behavior.

- [ ] **Step 1: Add `streakThreshold` to the `Settings` interface**

In [src/lib/store.svelte.ts](../../../src/lib/store.svelte.ts), find the `Settings` interface (lines 24-35):

```ts
export interface Settings {
	_v: number;
	name: string;
	startDate: string;
	rules: {
		alcohol: {
			path: 'none' | 'biweekly';
			lastDrinkDate: string | null;
		};
	};
	features: Features;
}
```

Replace it with:

```ts
export interface Settings {
	_v: number;
	name: string;
	startDate: string;
	streakThreshold: number;
	rules: {
		alcohol: {
			path: 'none' | 'biweekly';
			lastDrinkDate: string | null;
		};
	};
	features: Features;
}
```

- [ ] **Step 2: Bump `CURRENT_SETTINGS_VERSION` to 2**

Find line 37:

```ts
const CURRENT_SETTINGS_VERSION = 1;
```

Replace with:

```ts
const CURRENT_SETTINGS_VERSION = 2;
```

- [ ] **Step 3: Add migration entry for v2**

Find the `migrations` object (lines 40-57). It currently looks like:

```ts
const migrations: Record<number, (data: any) => any> = {
	1: (data) => ({
		_v: 1,
		name: data.name ?? '',
		startDate: data.startDate ?? getToday(),
		rules: {
			alcohol: {
				path: data.alcoholPath ?? 'none',
				lastDrinkDate: data.lastAlcoholDate ?? null
			}
		},
		features: {
			calendarShowCompletion: false
		}
	})
	// future versions go here:
	// 2: (data) => ({ ...data, _v: 2, ... })
};
```

Replace with:

```ts
const migrations: Record<number, (data: any) => any> = {
	1: (data) => ({
		_v: 1,
		name: data.name ?? '',
		startDate: data.startDate ?? getToday(),
		rules: {
			alcohol: {
				path: data.alcoholPath ?? 'none',
				lastDrinkDate: data.lastAlcoholDate ?? null
			}
		},
		features: {
			calendarShowCompletion: false
		}
	}),
	2: (data) => ({ ...data, _v: 2, streakThreshold: 100 })
};
```

The migration is intentionally minimal — it only adds the new field with the default. The migration function is "append-only" per the comment on line 39, so don't edit the v1 entry.

- [ ] **Step 4: Update `defaultSettings` in `loadSettings()`**

Find the `defaultSettings` literal (lines 133-141):

```ts
const defaultSettings: Settings = {
	_v: CURRENT_SETTINGS_VERSION,
	name: '',
	startDate: getToday(),
	rules: {
		alcohol: { path: 'none', lastDrinkDate: null }
	},
	features: { calendarShowCompletion: false }
};
```

Replace with:

```ts
const defaultSettings: Settings = {
	_v: CURRENT_SETTINGS_VERSION,
	name: '',
	startDate: getToday(),
	streakThreshold: 100,
	rules: {
		alcohol: { path: 'none', lastDrinkDate: null }
	},
	features: { calendarShowCompletion: false }
};
```

- [ ] **Step 5: Type-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error`

Expected: no errors. The settings page doesn't reference `streakThreshold` yet, but that's fine — it's a new optional-looking field that defaults are filled in for, and TypeScript only complains if something *reads* it without a fallback. Nothing currently does.

If svelte-check is slow or unavailable, run: `npx tsc --noEmit` as a fallback.

- [ ] **Step 6: Commit**

```bash
git add src/lib/store.svelte.ts
git commit -m "feat(store): settings v2 adds streakThreshold (default 100)"
```

---

### Task 2: Add `qualifiesForStreak` helper

**Files:**
- Modify: `src/lib/store.svelte.ts` — insert new helper just above `getStreak()` (currently line 258).

This helper centralizes the streak-qualification rule. At threshold 100 it routes to `isDayComplete` (preserving the existing strict semantics literally). Below 100 it recomputes the raw 5-habit completion pct (un-capped, since `getDayCompletionPct` caps incomplete days at 99 for *display* — not relevant for a threshold check).

- [ ] **Step 1: Add the helper function**

In [src/lib/store.svelte.ts](../../../src/lib/store.svelte.ts), find `getStreak()` at line 258. Just above it (after the closing `}` of `markAlcoholDrunk` on line 256), insert:

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
	const pct = (count / 5) * 100;
	return pct >= threshold;
}
```

The 5-habit formula here mirrors `getDayCompletionPct` ([store.svelte.ts:212-226](../../../src/lib/store.svelte.ts#L212-L226)). If that formula ever changes (different habit count, different weights), this helper must change with it. The comment explaining that link is omitted by request — the spec captures it.

The `?? 100` fallback exists for defense in depth: a freshly-loaded settings object that somehow predates the migration (corrupt localStorage, dev hot-reload edge case) won't crash — it falls back to strict mode.

- [ ] **Step 2: Type-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error`

Expected: no errors. The helper is defined but unused so far; the type checker won't complain about that (helpers inside `createStore` are not exported).

If you want to lint-check too: `npm run check` (this runs `svelte-kit sync && svelte-check`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/store.svelte.ts
git commit -m "feat(store): add qualifiesForStreak helper"
```

---

### Task 3: Update `getStreak()` to exclude today and use the helper

**Files:**
- Modify: `src/lib/store.svelte.ts:258-275`

Two changes: (1) start the loop at `i = 1` (yesterday) instead of `i = 0` (today), (2) use `qualifiesForStreak` instead of `isDayComplete`. The today-handling branches collapse — without today, it's a simple "walk back from yesterday, break on the first non-qualifying day" loop.

- [ ] **Step 1: Replace `getStreak()`**

Find `getStreak()` (currently lines 258-275):

```ts
function getStreak(): number {
	let streak = 0;
	const today = new Date();
	for (let i = 0; i < 75; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		if (i === 0) {
			if (data[dateStr] && isDayComplete(dateStr)) streak++;
			else if (!data[dateStr]) continue;
			else break;
		} else {
			if (data[dateStr] && isDayComplete(dateStr)) streak++;
			else break;
		}
	}
	return streak;
}
```

Replace with:

```ts
function getStreak(): number {
	let streak = 0;
	const today = new Date();
	for (let i = 1; i <= 75; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		if (data[dateStr] && qualifiesForStreak(dateStr)) streak++;
		else break;
	}
	return streak;
}
```

Notes:
- Loop bound changed from `i < 75` to `i <= 75`. Old: i ∈ {0..74} = today + 74 prior days = 75 days total. New: i ∈ {1..75} = 75 prior days. Same total length, just shifted by one.
- `data[dateStr]` falsy → loop breaks. This is correct: a missing log day breaks the streak (same semantics as before).

- [ ] **Step 2: Type-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/store.svelte.ts
git commit -m "fix(store): streak excludes today and respects threshold"
```

---

### Task 4: Update `getBestStreak()` to exclude today and use the helper

**Files:**
- Modify: `src/lib/store.svelte.ts:277-296`

Two changes: (1) walk only up to *yesterday* (loop condition `d < todayDate` instead of `d <= todayDate`), (2) use `qualifiesForStreak` instead of `isDayComplete` so current and best are measured on the same rule.

- [ ] **Step 1: Replace `getBestStreak()`**

Find `getBestStreak()` (currently lines 277-296):

```ts
function getBestStreak(): number {
	const start = settings.startDate;
	if (!start) return 0;
	const startDate = new Date(start + 'T12:00:00');
	const todayDate = new Date(getToday() + 'T12:00:00');
	let best = 0;
	let current = 0;
	const d = new Date(startDate);
	while (d <= todayDate) {
		const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		if (data[dateStr] && isDayComplete(dateStr)) {
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

Replace with:

```ts
function getBestStreak(): number {
	const start = settings.startDate;
	if (!start) return 0;
	const startDate = new Date(start + 'T12:00:00');
	const todayDate = new Date(getToday() + 'T12:00:00');
	let best = 0;
	let current = 0;
	const d = new Date(startDate);
	while (d < todayDate) {
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

Only two characters change: `<=` → `<` on the loop condition, and `isDayComplete` → `qualifiesForStreak` on the inside.

- [ ] **Step 2: Type-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/store.svelte.ts
git commit -m "fix(store): best streak excludes today and respects threshold"
```

---

### Task 5: Add the threshold slider to the Settings page

**Files:**
- Modify: `src/routes/settings/+page.svelte:5-9` (local state)
- Modify: `src/routes/settings/+page.svelte:13-27` (save function)
- Modify: `src/routes/settings/+page.svelte` — insert new card between the Alcohol Path card (closes around line 104) and the Feature Lab card (starts at line 107)

The slider commits on Save, matching the existing pattern (other fields here also bind locally and commit on Save, not on every change).

- [ ] **Step 1: Add local `streakThreshold` state**

In [src/routes/settings/+page.svelte](../../../src/routes/settings/+page.svelte), find lines 5-9:

```ts
let name = $state(store.settings.name);
let startDate = $state(store.settings.startDate);
let alcoholPath = $state<'none' | 'biweekly'>(store.settings.rules.alcohol.path);
let features = $state<Features>({ ...store.settings.features });
let saved = $state(false);
```

Replace with:

```ts
let name = $state(store.settings.name);
let startDate = $state(store.settings.startDate);
let alcoholPath = $state<'none' | 'biweekly'>(store.settings.rules.alcohol.path);
let streakThreshold = $state(store.settings.streakThreshold);
let features = $state<Features>({ ...store.settings.features });
let saved = $state(false);
```

- [ ] **Step 2: Include `streakThreshold` in `save()`**

Find the `save()` function (lines 13-27):

```ts
function save() {
	store.updateSettings({
		name,
		startDate,
		rules: {
			alcohol: {
				path: alcoholPath,
				lastDrinkDate: store.settings.rules.alcohol.lastDrinkDate
			}
		},
		features
	});
	saved = true;
	setTimeout(() => (saved = false), 2000);
}
```

Replace with:

```ts
function save() {
	store.updateSettings({
		name,
		startDate,
		streakThreshold,
		rules: {
			alcohol: {
				path: alcoholPath,
				lastDrinkDate: store.settings.rules.alcohol.lastDrinkDate
			}
		},
		features
	});
	saved = true;
	setTimeout(() => (saved = false), 2000);
}
```

`updateSettings` already uses `Object.assign(settings, rest)` for top-level fields ([store.svelte.ts:394-404](../../../src/lib/store.svelte.ts#L394-L404)), so it accepts `streakThreshold` without store-side changes.

- [ ] **Step 3: Insert the slider card**

In the same file, find the closing `</div>` of the Alcohol Path card. The Alcohol Path card starts with `<!-- Alcohol Path -->` (line 67) and ends with the `</div>` on line 104 (the outer `<div class="rounded-2xl bg-surface-2 p-4">`). Just *after* that closing `</div>` (line 104) and *before* the `<!-- Feature Lab -->` comment (line 106), insert a blank line and the new card:

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

The result is: Name → Start Date → Alcohol Path → **Streak Threshold (new)** → Feature Lab → Save Button → Rules Section → Danger Zone.

- [ ] **Step 4: Type-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error`

Expected: no errors. If `store.settings.streakThreshold` is reported as possibly `undefined`, that means Task 1 wasn't completed correctly — verify the `Settings` interface includes the new field as a required `number` (not optional).

- [ ] **Step 5: Commit**

```bash
git add src/routes/settings/+page.svelte
git commit -m "feat(settings): add streak threshold slider"
```

---

### Task 6: Manual verification

**Files:** none (browser testing)

Verify the migration, the threshold behavior, and the exclude-today behavior end-to-end.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Open the URL it prints (typically `http://localhost:5173`).

- [ ] **Step 2: Verify the settings migration ran**

Open DevTools → Application → Local Storage → your origin. Find the `75medium_settings` key. Confirm:
- `_v` is `2`
- `streakThreshold` is `100`

If the key didn't exist before this change, opening the app once is enough to seed it from `defaultSettings`. If it existed at `_v: 1` (no `streakThreshold` field), opening the app should have run the v2 migration on load and re-saved it.

- [ ] **Step 3: Verify the slider appears in Settings**

Navigate to `/settings`. Scroll to find the new "Streak Threshold" card between Alcohol Rule and Feature Lab. The right side shows `100%`. The slider is at the right end.

Drag the slider to ~80, watch the percentage label update live. Click Save (button reads "✓ Saved!" briefly). Reload. Confirm the slider returns to ~80 — proves the value persisted to localStorage.

Drag back to 100 and Save before continuing (so subsequent steps test threshold-100 behavior unless we change it deliberately).

- [ ] **Step 4: Verify "exclude today" — partial today doesn't break the streak**

In DevTools, find the `75medium_data` key. Locate today's entry (or create one if it doesn't exist by opening `/` and tapping a habit on today). Make today *partially* complete — e.g., only mark `noAlcohol: true` and leave `water: 0`, `steps: false`, `workout: false`, `noFriedFood: false`.

For yesterday's date (subtract 1 day from today's `YYYY-MM-DD`), add or modify an entry to be **fully complete**:

```json
{
  "date": "2026-06-10",
  "steps": true,
  "stepCount": 10000,
  "water": 12,
  "workout": true,
  "workoutType": ["Strength"],
  "noAlcohol": true,
  "noFriedFood": true,
  "notes": ""
}
```

(Substitute the actual `YYYY-MM-DD` for yesterday.)

Reload. Navigate to `/progress`. Confirm:
- "Current Streak" tile reads `🔥 1`
- Home page (navigate to `/`) header shows `🔥 1 streak`

Today's partial state did **not** break the streak. This is the bug fix.

- [ ] **Step 5: Verify "today complete" doesn't bump the streak prematurely**

Now make today *fully* complete (set water=12, steps=true with stepCount=10000, workout=true with at least one tag, noAlcohol=true, noFriedFood=true) by toggling habits on `/`.

Reload `/progress`. Confirm:
- "Current Streak" tile still reads `🔥 1` (NOT 2)

Today is excluded from the count regardless of state — the streak only changes at midnight when "today" rolls over.

- [ ] **Step 6: Verify threshold = 92 counts a partial day**

Open DevTools → `75medium_data`. Find yesterday's entry and downgrade it: set `stepCount: 6000`, `steps: false` (or just edit `stepCount` — the store recomputes `steps` on `updateLog`, but the manual edit path here lets us write any combination). Keep all four other habits true:

```json
{
  "date": "2026-06-10",
  "steps": false,
  "stepCount": 6000,
  "water": 12,
  "workout": true,
  "workoutType": ["Strength"],
  "noAlcohol": true,
  "noFriedFood": true,
  "notes": ""
}
```

This day computes as: 4 habits done (80%) + 6000/10000 steps × 20% = 92% raw.

Reload. Navigate to `/progress`. Confirm:
- "Current Streak" tile reads `🔥 0` (because threshold is still 100)

Now navigate to `/settings`, drag the slider to 92, Save. Navigate back to `/progress`. Confirm:
- "Current Streak" tile reads `🔥 1`

Threshold = 92 counts the 92% day.

- [ ] **Step 7: Verify threshold = 92 still excludes a sub-92 day**

In DevTools, lower yesterday's `stepCount` to `5000` (now 4 habits + 50% step = 80% + 10% = 90% raw, below 92).

Reload `/progress`. Confirm:
- "Current Streak" tile reads `🔥 0`

Threshold is correctly enforced.

- [ ] **Step 8: Verify Best Streak follows the threshold**

In DevTools, set `startDate` to ~14 days before today (in `75medium_settings`). In `75medium_data`, populate the past 14 days with a mix of "92% but not 100%" days and one or two "missed" days. Easiest: copy yesterday's 92% entry into the past 7 days, leave a gap on day 7-back, and complete days 8-13 back as 92% as well.

With threshold = 92, the longest run is at least the 6 most recent "92%" days. With threshold = 100, the longest run drops to whatever 100% days exist (probably 0 in this test).

Reload `/progress`. Confirm:
- At threshold = 92: `⚡ Best Streak` ≥ 6
- At threshold = 100 (slide back, save): `⚡ Best Streak` is small or 0

`bestStreak` honors the same threshold as `streak`.

- [ ] **Step 9: Verify nothing else regressed**

Still on `/progress`, scroll the page. Confirm these are visually identical to before the change:
- Big Progress Ring (day-of-challenge headline)
- Step Stats card
- Weekly Progress chart
- Habit Breakdown
- Workout Split
- 75-Day Map (calendar tiles, click navigation)

On `/`, confirm:
- All habit cards (Steps, Water, Workout, Alcohol, Fried Food, Journal) work as before
- Date switcher works
- The streak header shows up only when you're viewing today AND streak > 0

- [ ] **Step 10: Restore real data**

Restore `startDate`, `75medium_data`, and any other modified localStorage keys to your real values. Reload to confirm the real state renders correctly.

If you don't have a backup, the simplest restore is: in Settings → Danger Zone → Reset all data, then go through onboarding again.

---

### Task 7: Final commit (if any leftover changes)

**Files:** none (git operation)

If you committed after each task above, this should be a no-op — `git status` should be clean. But verify.

- [ ] **Step 1: Confirm working tree is clean**

Run: `git status`

Expected: `nothing to commit, working tree clean`.

If there are uncommitted changes, stage and commit them:

```bash
git add -u
git commit -m "feat: configurable streak threshold + exclude today"
```

- [ ] **Step 2: Confirm the commit history**

Run: `git log --oneline -10`

Expected: the recent commits should include (in order, oldest first):
- `feat(store): settings v2 adds streakThreshold (default 100)`
- `feat(store): add qualifiesForStreak helper`
- `fix(store): streak excludes today and respects threshold`
- `fix(store): best streak excludes today and respects threshold`
- `feat(settings): add streak threshold slider`

Five commits, one per task. The spec commit (`docs: spec for configurable streak threshold + exclude today`) precedes them.
