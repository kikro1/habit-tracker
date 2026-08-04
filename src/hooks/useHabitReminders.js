import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { todayStr } from '../utils/streaks'
import { hasNotifiedToday, markNotifiedToday, showHabitReminder } from '../utils/notifications'

/** Polls for habits whose reminder_time has just passed and shows a browser
 * notification, once per habit per day. Only fires while this tab is open. */
export default function useHabitReminders(enabled) {
  useEffect(() => {
    if (!enabled) return
    if (typeof Notification === 'undefined') return

    async function check() {
      if (Notification.permission !== 'granted') return

      const today = todayStr()
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()

      const [{ data: habits }, { data: logs }] = await Promise.all([
        supabase
          .from('habits')
          .select('id, name, reminder_time')
          .eq('archived', false)
          .not('reminder_time', 'is', null),
        supabase.from('habit_logs').select('habit_id').eq('date', today),
      ])

      if (!habits) return
      const doneToday = new Set((logs ?? []).map((l) => l.habit_id))

      for (const habit of habits) {
        if (doneToday.has(habit.id)) continue
        if (hasNotifiedToday(habit.id, today)) continue

        const [h, m] = habit.reminder_time.split(':').map(Number)
        const reminderMinutes = h * 60 + m

        if (nowMinutes >= reminderMinutes && nowMinutes - reminderMinutes < 5) {
          showHabitReminder(habit)
          markNotifiedToday(habit.id, today)
        }
      }
    }

    check()
    const interval = setInterval(check, 60 * 1000)
    return () => clearInterval(interval)
  }, [enabled])
}
