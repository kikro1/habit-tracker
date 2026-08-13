// Runs every minute via pg_cron + pg_net (see supabase/cron.sql). Finds
// habits whose reminder_time matches the current UTC minute, haven't been
// logged yet today, and haven't already had a reminder sent today, then
// pushes a Web Push notification to every subscription for that habit's
// owner. Auth is a shared secret header, not a user JWT — this always runs
// as the service role and touches every user's data by design.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const CRON_SECRET = Deno.env.get('CRON_SECRET')
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')

webpush.setVapidDetails('mailto:hello@fieldlog.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function currentUtcHHMM() {
  return new Date().toISOString().slice(11, 16)
}

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const nowHHMM = currentUtcHHMM()
  const today = todayUtcDate()

  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, user_id, name, reminder_time')
    .eq('archived', false)
    .not('reminder_time', 'is', null)

  if (habitsError) {
    return Response.json({ error: habitsError.message }, { status: 500 })
  }

  const dueHabits = (habits ?? []).filter((h) => h.reminder_time?.slice(0, 5) === nowHHMM)

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const habit of dueHabits) {
    const { data: log } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('habit_id', habit.id)
      .eq('date', today)
      .maybeSingle()
    if (log) {
      skipped++
      continue
    }

    const { error: sendError } = await supabase
      .from('reminder_sends')
      .insert({ habit_id: habit.id, date: today })
    if (sendError) {
      // unique violation = another concurrent run already claimed this send
      skipped++
      continue
    }

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', habit.user_id)

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: `Time for: ${habit.name}`,
            body: "It's on your Field Log for today. Tap to check it off.",
            tag: `habit-${habit.id}`,
            url: `/habits/${habit.id}`,
          })
        )
        sent++
      } catch (err) {
        const statusCode = err?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        errors.push(`${habit.id}:${sub.id}:${String(err)}`)
      }
    }
  }

  return Response.json({ nowHHMM, dueHabits: dueHabits.length, sent, skipped, errors })
})
