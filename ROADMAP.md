# 75 Medium Challenge — Roadmap

## What We Have Today

- [x] Daily habit tracker (steps, water, workout, alcohol, fried food)
- [x] Water tracker with +/- glass controls (12 glasses = 3L)
- [x] Alcohol path choice (zero or biweekly)
- [x] Sunday rest day for workouts
- [x] Progress page with stats, streak, and 75-day grid map
- [x] Settings page with name, start date, alcohol rule
- [x] Onboarding flow for first-time users
- [x] PWA with service worker (offline support, installable)
- [x] Install prompt with iOS/Android instructions
- [x] Motivational daily quotes
- [x] Dark theme with purple/warm color scheme

---

## Priority 1 — Fix the Gaps

> Things that are missing and people will notice immediately.

### Edit Past Days
- **Why:** If you forget to log before midnight, your streak dies. That's brutal.
- **What:** Swipeable date selector or calendar on the Today page so you can tap into any past day and toggle habits.
- **Effort:** Medium

### Data Export / Import
- **Why:** Everything is in localStorage. Clear your browser = lose 40 days of progress. Unacceptable.
- **What:** "Export JSON" and "Import JSON" buttons in Settings. Copy/paste or file download/upload.
- **Effort:** Small

### Undo Toggle
- **Why:** Fat-finger a habit toggle and it flips. No way to know what the previous state was.
- **What:** Small toast notification with "Undo" button that appears for 3 seconds after any toggle.
- **Effort:** Small

---

## Priority 2 — Make It Fun

> The stuff that makes you actually want to open the app every day.

### Confetti on Day Complete
- **Why:** Completing all 5 tasks should feel like a WIN. Right now it's a quiet green banner.
- **What:** Canvas confetti burst when `todayPct` hits 100%. Use `canvas-confetti` (2KB).
- **Effort:** Small

### Milestone Celebrations
- **Why:** Day 25, Day 50, Day 75 are huge. They deserve their own moment.
- **What:** Special full-screen celebration at Day 7 (first week), 25 (1/3), 50 (2/3), and 75 (DONE).
- **Effort:** Medium

### Haptic Feedback
- **Why:** Tapping water glasses and habit toggles should feel tactile on mobile.
- **What:** `navigator.vibrate(10)` on toggle, `navigator.vibrate(20)` on water add.
- **Effort:** Tiny

### Share Your Day Card
- **Why:** Social accountability. Post to group chat or IG stories.
- **What:** "Share" button that generates a styled card image (html2canvas or SVG-based).
- **Example:**
  ```
  Day 34/75 ✅
  👟 10K Steps ✅ | 💧 3L ✅ | 💪 Push Day ✅
  🔥 12-day streak
  ```
- **Effort:** Medium

---

## Priority 3 — More Depth

> Features that add richness and make the data more interesting.

### Step Count Input
- **Why:** "12,847 steps" is way more satisfying than a checkbox.
- **What:** Replace steps boolean with a number input. Auto-check if >= 10,000. Show actual count on progress page.
- **Effort:** Medium

### Workout Type Tags
- **Why:** Looking back at 75 days of workouts is cool. "Push", "Pull", "Legs", "Cardio", "Yoga", etc.
- **What:** Optional tag selector on the workout habit card. Shows in a workout log on progress page.
- **Effort:** Medium

### Daily Journal / Notes
- **Why:** After 75 days, reading back through "how I felt" entries would be incredible.
- **What:** Optional text field per day. Expandable on the Today page. Scrollable on progress.
- **Effort:** Medium

### Stats Deep Dives
- **Why:** The progress page is good but could tell a better story.
- **What:**
  - Weekly completion bar chart
  - Best streak ever vs current
  - Most consistent vs most missed habit
  - GitHub-style heat map view
- **Effort:** Large

---

## Priority 4 — Social / Multiplayer

> The killer features if you want this to be a real group experience.

### Group Leaderboard
- **Why:** This is what makes it sticky with friends. See who's on top, who's slacking.
- **What:** Simple backend (Supabase free tier). Group code to join. Leaderboard shows streaks, completion %, total days.
- **Effort:** Large (needs backend)

### Accountability Partners
- **Why:** Pair up. If one misses, the other gets notified. Peer pressure works.
- **What:** Paired mode where your partner's status shows on your dashboard.
- **Effort:** Large (needs backend + notifications)

### Penalty Tracker
- **Why:** "Miss a day = you owe the group $5" — fun motivation.
- **What:** Simple counter per person. Manual entry. Running total visible to the group.
- **Effort:** Medium (if backend already exists)

---

## Priority 5 — Polish

> Nice-to-haves that round out the experience.

### Light Theme Toggle
- **Why:** Some people want light mode during the day.
- **What:** Theme toggle in settings. CSS custom properties already support it.
- **Effort:** Medium

### Daily Reminder Notifications
- **Why:** "You still have 2 tasks left!" at 8pm would save streaks.
- **What:** PWA Notifications API. Configurable time in settings.
- **Effort:** Medium

### Water Tracker Enhancements
- **Why:** Small UX wins add up.
- **What:**
  - "Add bottle" quick button (+4 glasses)
  - Subtle fill animation
  - Haptic on each glass
- **Effort:** Small

### Animated Page Transitions
- **Why:** Makes the app feel native.
- **What:** Svelte page transitions between Today / Progress / Settings.
- **Effort:** Small

---

## Suggested Build Order

| Phase | Features | When |
|-------|----------|------|
| **Next up** | Edit past days, Data export/import, Confetti | This week |
| **Round 2** | Share card, Haptics, Milestone celebrations | Next week |
| **Round 3** | Step count input, Workout tags, Journal | Week 3 |
| **Round 4** | Group leaderboard (needs backend decision) | Week 4+ |
| **Ongoing** | Polish, stats, theme, notifications | As we go |

---

*Last updated: April 2026*
