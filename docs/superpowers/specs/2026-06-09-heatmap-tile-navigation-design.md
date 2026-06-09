---
name: heatmap-tile-navigation
description: Clicking a past/today heatmap tile on the Progress page navigates to the Today tab with that day pre-selected
metadata:
  type: project
---

# Heatmap Tile Navigation

## Overview

When a user taps a past or today tile in the 75-day heatmap on the Progress page, they are navigated to the Today tab (`/`) with that day's date pre-selected — so they can review or edit that day's habits directly.

## Affected Files

- `src/routes/progress/+page.svelte` — heatmap tiles
- `src/routes/+page.svelte` — Today page, reads date from URL

## Behaviour

### Progress Page (heatmap)

- Tiles with `status === 'complete'`, `status === 'incomplete'`, or `status === 'today'` become interactive.
- Clicking calls `goto('/?date=<dateStr>')` via SvelteKit's `goto`.
- Visual: interactive tiles gain `cursor-pointer` and a hover effect (e.g. `hover:brightness-110 hover:scale-105`).
- Future tiles (`status === 'future'`) remain plain divs — no interaction, no cursor change.

### Today Page (date init from URL)

- On mount, read `$page.url.searchParams.get('date')`.
- Validate: must match `YYYY-MM-DD` format and fall within the challenge's start date and today (inclusive).
- If valid: set `selectedDate` to that value.
- If invalid or absent: fall back to `store.today` (current behaviour unchanged).
- After reading, call `replaceState('/', {})` to clean the URL so the param doesn't persist on back navigation.

## Data Flow

```
User taps tile (past/today)
  → goto('/?date=2025-06-03')
  → Today page mounts / navigates
  → reads ?date param
  → validates date is within range
  → sets selectedDate = '2025-06-03'
  → DateSwitcher shows Day 3
  → replaceState cleans URL to /
```

## Edge Cases

| Scenario | Handling |
|---|---|
| Invalid date string in `?date` | Ignored, falls back to `store.today` |
| Date before challenge start | Ignored, falls back to `store.today` |
| Date after today (future) | Ignored, falls back to `store.today` |
| No `?date` param | Falls back to `store.today` (unchanged behaviour) |
| Future tile tapped | Not interactive — no navigation |

## Visual Changes

- Past/today tiles: add `cursor-pointer hover:brightness-110 hover:scale-105 transition-transform` to existing class string.
- No new components needed.
- No layout changes.

## No-Scope

- No changes to settings, store, Nav, or any other route.
- No animation or sheet/modal — direct navigation only.
