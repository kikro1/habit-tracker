-- Schedules the reminder sender to run every minute via pg_cron + pg_net.
-- Run this in the Supabase SQL Editor AFTER deploying the `send-reminders`
-- edge function and setting its secrets (see README "Push notifications").
--
-- Replace the three placeholders below:
--   YOUR_PROJECT_REF   -- e.g. abcdefghijklmno
--   YOUR_ANON_KEY      -- the legacy anon JWT from Project Settings -> API
--                          (needed only so the platform gateway accepts the
--                          request; the edge function's real auth check is
--                          the x-cron-secret header below)
--   YOUR_CRON_SECRET   -- same value you set with `supabase secrets set CRON_SECRET=...`

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('send-habit-reminders')
where exists (select 1 from cron.job where jobname = 'send-habit-reminders');

select cron.schedule(
  'send-habit-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'x-cron-secret', 'YOUR_CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
