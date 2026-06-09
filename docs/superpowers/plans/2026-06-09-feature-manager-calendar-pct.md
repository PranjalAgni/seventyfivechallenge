# Feature Manager + Calendar Completion % Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Feature Manager section to Settings that toggles experimental features, with the first feature being "Show % in Calendar" — replacing day numbers in the 75-day heatmap with completion percentages and gradient coloring. Also restructures `Settings` into a clean domain-grouped shape (`rules.alcohol`) with a versioned migration system so future schema changes are safe and append-only.

**Architecture:**
- Versioned migration system modelled after redux-persist's `createMigrate`: a `Record<number, fn>` map keyed by target version + a generic `runMigrations` runner that filters, sorts, and reduces. Runner never changes — only the map grows.
- `Settings` restructured: alcohol config nested under `rules.alcohol`, feature flags under `features`. Schema version tracked via `_v` integer in the saved data.
- Feature Lab card in Settings with pill toggle per feature.
- Progress page conditionally shows `completionPct` and heatmap colors when `calendarShowCompletion` flag is on.

**Tech Stack:** SvelteKit 5, Svelte 5 runes (`$state`, `$derived`), Tailwind CSS v4, localStorage persistence

---

## File Map

| File | Change |
|---|---|
| `src/lib/store.svelte.ts` | New `Settings` shape, `Features` type, `migrations` map, `runMigrations` runner, updated `loadSettings`, updated internal references |
| `src/routes/settings/+page.svelte` | Rebind to `rules.alcohol.path`, add `features` state, Feature Lab card |
| `src/routes/progress/+page.svelte` | Extend `CalendarDay`, compute `completionPct`, conditional cell rendering + legend |

---

## How the Migration System Works

Every time `loadSettings()` runs it checks `data._v ?? 0` (old data has no `_v`, so it's treated as version 0). The runner filters the `migrations` map for keys in the gap between stored version and `CURRENT_SETTINGS_VERSION`, sorts ascending, and reduces state through each migration in sequence.

After migration, the updated data is written back to localStorage immediately — so the next app load finds `_v` already at the current version and skips all migration work.

**Adding a future version:** add one key to `migrations`, bump `CURRENT_SETTINGS_VERSION`. The runner is untouched.

**Deleting old migration entries:** keep them forever (or until you set an explicit minimum supported version floor). A user who hasn't opened the app in months must have a complete migration path. Migration functions are tiny — there's no cost to keeping them.

---

## Task 1: Store — New Settings Shape + Migration System

**Files:**
- Modify: `src/lib/store.svelte.ts`

- [ ] **Step 1: Add `Features` interface, restructure `Settings`**

Replace the existing `Settings` interface with:

```typescript
export interface Features {
	calendarShowCompletion: boolean;
}

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

The old flat keys `alcoholPath` and `lastAlcoholDate` are gone — now nested under `rules.alcohol`.

- [ ] **Step 2: Add the migrations map + runner**

Add this block directly after the `Settings` interface. The `migrations` map is **append-only** — never edit an existing entry, only add new keys at the bottom.

```typescript
const CURRENT_SETTINGS_VERSION = 1;

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
	// 2: (data) => ({ ...data, _v: 2, rules: { ...data.rules, diet: { ... } } })
};

function runMigrations(data: any): Settings {
	const fromVersion = data._v ?? 0;

	return Object.keys(migrations)
		.map(Number)
		.filter(v => v > fromVersion && v <= CURRENT_SETTINGS_VERSION)
		.sort((a, b) => a - b)
		.reduce((state, v) => migrations[v](state), data) as Settings;
}
```

- [ ] **Step 3: Replace `loadSettings()`**

```typescript
function loadSettings(): Settings {
	const defaultSettings: Settings = {
		_v: CURRENT_SETTINGS_VERSION,
		name: '',
		startDate: getToday(),
		rules: {
			alcohol: { path: 'none', lastDrinkDate: null }
		},
		features: { calendarShowCompletion: false }
	};

	if (typeof window === 'undefined') return defaultSettings;

	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (!raw) return defaultSettings;
		const parsed = JSON.parse(raw);
		const migrated = runMigrations(parsed);
		// write back immediately so next load skips already-run migrations
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(migrated));
		return migrated;
	} catch {
		return defaultSettings;
	}
}
```

- [ ] **Step 4: Update internal store references to old flat keys**

Inside `createStore()`, find `canDrinkAlcohol` and `markAlcoholDrunk`:

```typescript
// canDrinkAlcohol — before:
if (settings.alcoholPath === 'none') return false;
if (!settings.lastAlcoholDate) return true;
const last = new Date(settings.lastAlcoholDate + 'T12:00:00');

// canDrinkAlcohol — after:
if (settings.rules.alcohol.path === 'none') return false;
if (!settings.rules.alcohol.lastDrinkDate) return true;
const last = new Date(settings.rules.alcohol.lastDrinkDate + 'T12:00:00');

// markAlcoholDrunk — before:
settings.lastAlcoholDate = date;

// markAlcoholDrunk — after:
settings.rules.alcohol.lastDrinkDate = date;
```

- [ ] **Step 5: Type-check**

```bash
npm run check
```

Expected: TypeScript errors only in `src/routes/settings/+page.svelte` (old bindings — fixed in Task 2). Zero errors inside `store.svelte.ts` itself.

---

## Task 2: Settings Page — New Bindings + Feature Lab Card

**Files:**
- Modify: `src/routes/settings/+page.svelte`

- [ ] **Step 1: Update script block**

Replace the full `<script>` block with:

```typescript
import { store } from '$lib/store.svelte';
import type { Features } from '$lib/store.svelte';

let name = $state(store.settings.name);
let startDate = $state(store.settings.startDate);
let alcoholPath = $state<'none' | 'biweekly'>(store.settings.rules.alcohol.path);
let features = $state<Features>({ ...store.settings.features });
let saved = $state(false);
let showReset = $state(false);

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

function resetAll() {
	if (typeof window !== 'undefined') {
		localStorage.clear();
		window.location.reload();
	}
}
```

- [ ] **Step 2: Add the Feature Lab card to the template**

After the Alcohol Rule card's closing `</div>` and before the Save button:

```svelte
<!-- Feature Lab -->
<div class="rounded-2xl bg-surface-2 p-4">
	<p class="mb-1 text-xs font-bold uppercase tracking-wider text-text-dim">Feature Lab</p>
	<p class="mb-3 text-[11px] text-text-muted">Experimental features — toggle on to try them out.</p>

	<button
		onclick={() => (features.calendarShowCompletion = !features.calendarShowCompletion)}
		class="flex w-full items-center justify-between rounded-xl p-3 transition-all
			{features.calendarShowCompletion ? 'bg-accent-500/15 ring-1 ring-accent-500/30' : 'bg-surface-3'}"
	>
		<div class="text-left">
			<p class="text-sm font-bold text-text">📊 Show % in Calendar</p>
			<p class="text-xs text-text-muted">Replace day numbers with completion % on the 75-day map</p>
		</div>
		<div
			class="relative ml-3 h-6 w-11 shrink-0 rounded-full transition-colors
				{features.calendarShowCompletion ? 'bg-accent-500' : 'bg-surface-4'}"
		>
			<div
				class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform
					{features.calendarShowCompletion ? 'translate-x-5' : 'translate-x-0.5'}"
			></div>
		</div>
	</button>
</div>
```

- [ ] **Step 3: Type-check and manual verify**

```bash
npm run check
npm run dev
```

1. Open `/settings` — name, start date, alcohol rule load correctly from existing localStorage (migration ran on first load)
2. Toggle "Show % in Calendar" → Save → DevTools → Application → Local Storage → `75medium_settings`:

```json
{
  "_v": 1,
  "name": "...",
  "startDate": "...",
  "rules": { "alcohol": { "path": "none", "lastDrinkDate": null } },
  "features": { "calendarShowCompletion": true }
}
```

---

## Task 3: Progress Page — Conditional Calendar Rendering

**Files:**
- Modify: `src/routes/progress/+page.svelte`

- [ ] **Step 1: Extend `CalendarDay` interface**

```typescript
interface CalendarDay {
	date: string;
	dayNum: number;
	status: 'complete' | 'incomplete' | 'future' | 'today';
	completionPct: number;
}
```

- [ ] **Step 2: Add per-day completion % helper**

After the `CalendarDay` interface:

```typescript
function getDayCompletionPct(dateStr: string): number {
	const log = store.peekLog(dateStr);
	const isSunday = store.getDayOfWeek(dateStr) === 0;
	let count = 0;
	if (log.steps) count++;
	if (log.water >= 12) count++;
	if (isSunday || log.workout) count++;
	if (log.noAlcohol) count++;
	if (log.noFriedFood) count++;
	return Math.round((count / 5) * 100);
}
```

- [ ] **Step 3: Include `completionPct` in `calendarDays` derived block**

Find the `.push()` call inside the `calendarDays` derived block:

```typescript
// before:
days.push({ date: dateStr, dayNum: i + 1, status });

// after:
const completionPct = status === 'future' ? 0 : getDayCompletionPct(dateStr);
days.push({ date: dateStr, dayNum: i + 1, status, completionPct });
```

- [ ] **Step 4: Add feature flag derived value**

After the `calendarDays` derived block:

```typescript
const calendarShowCompletion = $derived(
	store.settings.features?.calendarShowCompletion ?? false
);
```

- [ ] **Step 5: Add heatmap color helper**

```typescript
function getHeatmapClass(day: CalendarDay): string {
	if (day.status === 'future') return 'bg-surface-3 text-text-dim';
	if (day.status === 'today') return 'bg-accent-500 text-white ring-2 ring-accent-300 shadow-lg shadow-accent-500/30';
	if (day.completionPct === 100) return 'bg-mint-500 text-white shadow-sm shadow-mint-500/20';
	if (day.completionPct >= 60) return 'bg-warm-400 text-white';
	if (day.completionPct >= 20) return 'bg-warm-500/60 text-white';
	if (day.completionPct > 0) return 'bg-rose-500/40 text-white';
	return 'bg-rose-500/20 text-text-muted';
}
```

- [ ] **Step 6: Update cell rendering**

Replace the entire `<div>` cell inside `{#each calendarDays as day}`:

```svelte
{#each calendarDays as day}
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
		{#if calendarShowCompletion}
			{day.status === 'future' ? '' : day.completionPct + '%'}
		{:else}
			{day.dayNum}
		{/if}
	</div>
{/each}
```

- [ ] **Step 7: Update the legend conditionally**

Replace the legend `<div>` after the grid:

```svelte
<div class="mt-3 flex items-center justify-center gap-4 text-xs text-text-muted">
	{#if calendarShowCompletion}
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-mint-500"></span> 100%
		</span>
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-warm-400"></span> 60–99%
		</span>
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500/40"></span> &lt;60%
		</span>
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-accent-500"></span> Today
		</span>
	{:else}
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-mint-500"></span> Done
		</span>
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500/50"></span> Missed
		</span>
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-accent-500"></span> Today
		</span>
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-surface-3"></span> Future
		</span>
	{/if}
</div>
```

- [ ] **Step 8: End-to-end verification**

```bash
npm run check
npm run dev
```

1. `/settings` → Feature Lab → toggle "Show % in Calendar" ON → Save
2. `/progress` → 75-Day Map — past days show `0%`/`20%`/`60%`/`100%` with heatmap colors; today shows accent ring; future cells empty; legend shows `100% / 60–99% / <60% / Today`
3. Toggle OFF → reverts to day numbers + original legend
4. Refresh — state persists
5. Wipe localStorage, reload → fresh app works (migration skipped, defaults applied)
