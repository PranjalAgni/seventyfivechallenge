# 75 Medium Challenge Tracker

A mobile-first PWA to track the 75 Medium Challenge with your crew. Stay locked in.

## The Rules

- **10K Steps** every day
- **3L Water** every day (tracked as 12 x 250ml glasses)
- **Strength Train** every day (Sunday is rest day)
- **No Alcohol** — or choose the biweekly path (1 drink every 14 days)
- **No Fried Food** for 75 days

## Tech Stack

- [SvelteKit](https://svelte.dev) with Svelte 5 runes
- [TailwindCSS v4](https://tailwindcss.com)
- PWA with offline support (service worker)
- localStorage for data persistence — no backend needed

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 on your phone (or use `--host` to expose on your network).

## Install as PWA

On your phone's browser, tap "Add to Home Screen" to install it as an app.

## Build & Deploy

```bash
npm run build
```

The `build/` folder contains a fully static site you can deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).
