# Field Log — a habit tracker

A small, paper-ledger-styled habit tracker. React + Vite frontend, Supabase
(Postgres + Auth + Edge Functions) backend, installable as a PWA, deployable
as a static site.

## Stack

- React + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`, theme defined in `src/index.css` via `@theme`)
- Supabase (Postgres + Auth + Edge Functions)
- react-router-dom
- recharts
- react-calendar-heatmap
- date-fns
- lucide-react
- vite-plugin-pwa (installable app, offline-ish shell, push notifications)

## Features

- Email/password auth (sign up, sign in, sign out) via Supabase Auth. Unauthenticated users are redirected to `/login`.
- Habits: name, optional description, color, frequency (`daily` or `N times / week`), goal target, optional reminder time. Create, edit, delete (with confirmation).
- **Today** dashboard: toggle each habit done/not-done for today, see current streak, weekly-frequency habits show a "3/5 this week" progress bar, and a calendar-clock button on each card lets you mark any past day done without leaving the dashboard.
- **Habit detail**: 6-month heatmap calendar (click a day to mark/unmark it — future days are disabled), current streak, best streak ever, 30-day completion %, bar chart of marks per week (last 12 weeks).
- **Stats**: area chart of total marks across all habits for the last 30 days, table of habits sorted by current streak (streak / record / total marks).
- **Push notifications**: set a reminder time on a habit and get a real push notification at that time — even if the app/tab is closed — sent by a Supabase Edge Function on a `pg_cron` schedule.
- **Installable PWA**: add to home screen on mobile or desktop; the app shell and last-seen data are cached for offline-ish use.
- Row Level Security in Postgres — every user only ever sees and edits their own rows, even with the public anon key.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** → **New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates `habits`, `habit_logs`, `push_subscriptions`, `reminder_sends`, indexes, and RLS policies. Safe to re-run.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. (Optional) In **Authentication → Providers → Email**, disable "Confirm email" if you want to sign in immediately after registering without verifying an email address first.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. This file is git-ignored and must never be committed. `VITE_VAPID_PUBLIC_KEY` is optional at this stage — set it up in step 5 below.

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

## 5. Push notifications (optional)

Reminders need a small server-side piece since they must fire even when the app is closed.

1. Generate a VAPID key pair (used to sign push messages):
   ```bash
   npx web-push generate-vapid-keys --json
   ```
2. Add the **public** key to `.env` as `VITE_VAPID_PUBLIC_KEY` (safe to expose — it's public by design).
3. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
4. Deploy the reminder-sending edge function:
   ```bash
   supabase functions deploy send-reminders
   ```
5. Set its secrets — the VAPID **private** key never goes in `.env` or gets committed:
   ```bash
   supabase secrets set \
     VAPID_PUBLIC_KEY=<public key from step 1> \
     VAPID_PRIVATE_KEY=<private key from step 1> \
     CRON_SECRET=$(openssl rand -hex 24)
   ```
6. Open [`supabase/cron.sql`](supabase/cron.sql), fill in your project ref, anon key, and the `CRON_SECRET` you just generated, and run it in the SQL Editor. This schedules `send-reminders` to run every minute via `pg_cron` + `pg_net` — no separate server or Vercel Cron Job needed (Vercel's Hobby-plan cron only fires once a day, which isn't precise enough for a specific reminder time).

Reminder times are stored in UTC, converted from the browser's local time when you save a habit — this can drift by up to an hour around DST transitions, which is an accepted tradeoff for not needing a timezone column.

## 6. Deploy

### Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel → framework preset **Vite**.
3. Add environment variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_VAPID_PUBLIC_KEY` in **Project Settings → Environment Variables**.
4. Deploy.

### Netlify

1. Push this repo to GitHub.
2. **Add new site → Import an existing project**.
3. Build command: `npm run build`, publish directory: `dist`.
4. Add the same environment variables in **Site settings → Environment variables**.
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
  components/BackdateMenu.jsx  quick "mark a past day" popover on each card
  components/NewHabitModal.jsx
  components/TallyMarks.jsx
  utils/streaks.js         streak / completion-rate / chart-data calculations
  utils/time.js            local <-> UTC time-of-day conversion for reminders
  utils/notifications.js   Web Push subscribe flow
  sw.js                    custom service worker (offline caching + push handling)
supabase/
  schema.sql               tables, indexes, RLS policies
  cron.sql                 pg_cron + pg_net schedule for the reminder sender
  functions/send-reminders/  edge function that sends the actual push notifications
```
