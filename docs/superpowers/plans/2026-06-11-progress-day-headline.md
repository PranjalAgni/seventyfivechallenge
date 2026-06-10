# Progress Day-of-Challenge Headline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the Progress page header to show day-of-challenge / 75 (e.g., "45 / 75 days") instead of perfect-days / 75, and demote the perfect-days count to a subtitle.

**Architecture:** Single-file change to `src/routes/progress/+page.svelte`. Replace the existing `overallPct` derived value with a set of derived values that drive both the in-progress and pre-start states. Header markup branches on `hasStarted`: in-progress shows `{dayHeadline} / 75 days` with the days-left/perfect-days subtitle; pre-start shows `Starts in {N} days` with the formatted start date.

**Tech Stack:** Svelte 5 (`$derived`), SvelteKit, TypeScript.

**Spec:** [docs/superpowers/specs/2026-06-11-progress-day-headline-design.md](../specs/2026-06-11-progress-day-headline-design.md)

---

## File Map

- **Modify:** `src/routes/progress/+page.svelte` — script block (replace one `$derived`, add two more) and header card markup (`<ProgressRing>` prop, headline `<p>`, subtitle `<p>`).

No store changes — `store.dayNumber` ([src/lib/store.svelte.ts:302-308](../../../src/lib/store.svelte.ts#L302-L308)) and `store.totalComplete` ([src/lib/store.svelte.ts:298-300](../../../src/lib/store.svelte.ts#L298-L300)) already provide everything.

This project does not have an automated test suite — verification is manual via the dev server.

---

### Task 1: Replace `overallPct` with new derived values

**Files:**
- Modify: `src/routes/progress/+page.svelte:6`

The current derived value computes a perfect-days percentage:

```ts
const overallPct = $derived(Math.round((store.totalComplete / 75) * 100));
```

We replace it with derived values that drive the new headline, subtitle, ring, and the pre-start branch.

- [ ] **Step 1: Replace the `overallPct` line**

In `src/routes/progress/+page.svelte`, find line 6:

```ts
const overallPct = $derived(Math.round((store.totalComplete / 75) * 100));
```

Replace it with:

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

Notes:
- `hasStarted` uses `YYYY-MM-DD` string comparison, the same pattern the calendar block uses ([+page.svelte:27-28](../../../src/routes/progress/+page.svelte#L27-L28)). Strings like `"2026-06-11"` sort lexicographically the same way they sort chronologically, so this is correct.
- The `'T12:00:00'` suffix when constructing `Date` objects avoids timezone edge cases at midnight (matches the existing pattern in the file and store).
- Clamping `dayHeadline` at 75 means the ring stays at 100% and the headline reads "75 / 75 days" past the challenge end, instead of 80/75 or a 107% ring.
- `daysUntilStart` returns 0 when `hasStarted` is true; the markup never reads it in that branch, but returning 0 keeps the value defined.

- [ ] **Step 2: Verify the file still type-checks**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error`

Expected: no errors. (Warnings are fine.) If `overallPct` is referenced anywhere else and you missed it, this will surface it.

If svelte-check is slow or unavailable, run: `npx tsc --noEmit` as a fallback.

---

### Task 2: Update the header card markup

**Files:**
- Modify: `src/routes/progress/+page.svelte:89-96`

The header card currently looks like this:

```svelte
<!-- Big Progress Ring -->
<div class="flex flex-col items-center gap-3 rounded-2xl bg-surface-2 p-6">
    <ProgressRing percentage={overallPct} size={140} strokeWidth={10} />
    <div class="text-center">
        <p class="text-lg font-bold text-text">{store.totalComplete} / 75 days</p>
        <p class="text-sm text-text-muted">{75 - store.totalComplete} days remaining</p>
    </div>
</div>
```

We replace the inner `<div class="text-center">` block with an `{#if hasStarted}` branch. The outer card shell, the `<ProgressRing>`, and the `text-center` wrapper stay; only the two `<p>` tags inside differ between branches.

- [ ] **Step 1: Replace the entire header card block**

In `src/routes/progress/+page.svelte`, find the block (lines 89-96):

```svelte
<!-- Big Progress Ring -->
<div class="flex flex-col items-center gap-3 rounded-2xl bg-surface-2 p-6">
    <ProgressRing percentage={overallPct} size={140} strokeWidth={10} />
    <div class="text-center">
        <p class="text-lg font-bold text-text">{store.totalComplete} / 75 days</p>
        <p class="text-sm text-text-muted">{75 - store.totalComplete} days remaining</p>
    </div>
</div>
```

Replace it with:

```svelte
<!-- Big Progress Ring -->
<div class="flex flex-col items-center gap-3 rounded-2xl bg-surface-2 p-6">
    <ProgressRing percentage={ringPct} size={140} strokeWidth={10} />
    <div class="text-center">
        {#if hasStarted}
            <p class="text-lg font-bold text-text">{dayHeadline} / 75 days</p>
            <p class="text-sm text-text-muted">{daysLeft} days left · {store.totalComplete} perfect days so far</p>
        {:else}
            <p class="text-lg font-bold text-text">Starts in {daysUntilStart} {daysUntilStart === 1 ? 'day' : 'days'}</p>
            <p class="text-sm text-text-muted">{prettyStartDate}</p>
        {/if}
    </div>
</div>
```

The `{daysUntilStart === 1 ? 'day' : 'days'}` keeps the wording grammatical the day before the challenge starts ("Starts in 1 day" rather than "Starts in 1 days").

- [ ] **Step 2: Type-check again**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error`

Expected: no errors.

---

### Task 3: Manual verification

**Files:** none (browser testing)

This project has no automated test suite, so we verify by running the app and inspecting the Progress page across the in-progress states (day 1, mid, post-challenge) and the pre-start state.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Open the URL it prints (typically `http://localhost:5173`).

- [ ] **Step 2: Verify Day 1 state**

In DevTools → Application → Local Storage → your origin, find the `75medium_settings` key. If the `startDate` is not today, set it to today's date in `YYYY-MM-DD` format. Reload.

Navigate to `/progress`. Confirm:
- Headline reads `1 / 75 days`
- Subtitle reads `74 days left · 0 perfect days so far` (or whatever your current `totalComplete` is)
- Ring fills ~1% (a sliver, not zero)

- [ ] **Step 3: Verify mid-challenge state**

In `75medium_settings`, set `startDate` to a date approximately 45 days before today. Reload.

Navigate to `/progress`. Confirm:
- Headline reads `45 / 75 days` (or whatever the day count actually is — match your math)
- Subtitle reads `30 days left · {N} perfect days so far`
- Ring fills approximately 60%

- [ ] **Step 4: Verify post-challenge state**

In `75medium_settings`, set `startDate` to ~80 days before today. Reload.

Navigate to `/progress`. Confirm:
- Headline reads `75 / 75 days` (NOT `80 / 75 days`)
- Subtitle reads `0 days left · {N} perfect days so far` (NOT a negative number)
- Ring fills 100%

- [ ] **Step 5: Verify pre-start state**

In `75medium_settings`, set `startDate` to a date 4 days in the future (e.g., if today is `2026-06-11`, set it to `2026-06-15`). Reload.

Navigate to `/progress`. Confirm:
- Headline reads `Starts in 4 days`
- Subtitle reads the formatted start date (e.g., `June 15`)
- Ring is empty (0%)
- The perfect-days line is NOT shown
- 75-Day Map below is all "future" tiles (no green/red)

Now set `startDate` to exactly 1 day in the future and reload. Confirm headline reads `Starts in 1 day` (singular, not "1 days").

- [ ] **Step 6: Verify the rest of the page is unchanged**

Still on `/progress`, scroll through the rest of the page. Confirm these are visually identical to before the change:
- Stats grid (streak, best streak, water, workouts)
- Step Stats card (if any steps logged)
- Weekly Progress chart
- Habit Breakdown
- Workout Split
- 75-Day Map (still 75 tiles, click behavior unchanged)

- [ ] **Step 7: Restore your real `startDate`**

Set `startDate` back to your actual challenge start date in localStorage. Reload to confirm the real state renders correctly.

---

### Task 4: Commit

**Files:** none (git operation)

- [ ] **Step 1: Confirm only the expected file changed**

Run: `git status`

Expected output: only `src/routes/progress/+page.svelte` is modified.

Run: `git diff src/routes/progress/+page.svelte`

Expected: ~6 lines changed in the script block (one `$derived` removed, three added) and 3 lines changed in the header card markup. Nothing else.

- [ ] **Step 2: Commit**

```bash
git add src/routes/progress/+page.svelte
git commit -m "feat: progress headline shows day-of-challenge / 75"
```
