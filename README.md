# Field Log — a habit tracker

A small, paper-ledger-styled habit tracker. React + Vite frontend, Supabase
(Postgres + Auth) backend, deployable as a static site.

## Stack

- React + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`, theme defined in `src/index.css` via `@theme`)
- Supabase (Postgres + Auth)
- react-router-dom
- recharts
- react-calendar-heatmap
- date-fns
- lucide-react

## Features

- Email/password auth (sign up, sign in, sign out) via Supabase Auth. Unauthenticated users are redirected to `/login`.
- Habits: name, optional description, color, frequency (`daily` or `N times / week`), goal target. Create, edit, delete (with confirmation).
- **Today** dashboard: toggle each habit done/not-done for today, see current streak, jump to a habit's detail page.
- **Habit detail**: 6-month heatmap calendar (click a day to mark/unmark it — future days are disabled), current streak, best streak ever, 30-day completion %, bar chart of marks per week (last 12 weeks).
- **Stats**: area chart of total marks across all habits for the last 30 days, table of habits sorted by current streak (streak / record / total marks).
- Row Level Security in Postgres — every user only ever sees and edits their own rows, even with the public anon key.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** → **New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `habits` and `habit_logs` tables, indexes, and RLS policies.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. (Optional) In **Authentication → Providers → Email**, disable "Confirm email" if you want to sign in immediately after registering without verifying an email address first.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. This file is git-ignored and must never be committed.

## 3. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL, register an account, and start logging habits.

## 4. Build

```bash
npm run build
npm run preview   # optional: preview the production build locally
```

## 5. Deploy

### Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel → framework preset **Vite**.
3. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Project Settings → Environment Variables**.
4. Deploy.

### Netlify

1. Push this repo to GitHub.
2. **Add new site → Import an existing project**.
3. Build command: `npm run build`, publish directory: `dist`.
4. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Site settings → Environment variables**.
5. Deploy.

Since this is a client-side single-page app, both platforms need a SPA fallback (serve `index.html` for unknown routes) — both Vercel and Netlify's Vite presets handle this automatically.

## Project structure

```
src/
  lib/supabase.js          Supabase client (reads env vars)
  context/AuthContext.jsx  auth session state + sign in/up/out
  pages/Login.jsx
  pages/Dashboard.jsx      "Today" view
  pages/HabitDetail.jsx    heatmap + streak stats + weekly chart
  pages/Stats.jsx          overall chart + sorted habit table
  components/Layout.jsx
  components/HabitCard.jsx
  components/NewHabitModal.jsx
  components/TallyMarks.jsx
  utils/streaks.js         streak / completion-rate / chart-data calculations
supabase/schema.sql        tables, indexes, RLS policies
```
