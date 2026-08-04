import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { supabase } from '../lib/supabase'
import TallyMarks from '../components/TallyMarks'
import { getCurrentStreak, getBestStreak } from '../utils/streaks'

export default function Stats() {
  const [habits, setHabits] = useState([])
  const [logsByHabit, setLogsByHabit] = useState({})
  const [allLogs, setAllLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: habitsData }, { data: logsData }] = await Promise.all([
      supabase.from('habits').select('*').eq('archived', false),
      supabase.from('habit_logs').select('habit_id, date'),
    ])

    setHabits(habitsData ?? [])
    setAllLogs(logsData ?? [])

    const grouped = {}
    for (const log of logsData ?? []) {
      if (!grouped[log.habit_id]) grouped[log.habit_id] = []
      grouped[log.habit_id].push(log.date)
    }
    setLogsByHabit(grouped)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const dailyTotals = useMemo(() => {
    const today = startOfDay(new Date())
    const counts = new Map()
    for (const log of allLogs) {
      counts.set(log.date, (counts.get(log.date) || 0) + 1)
    }
    const data = []
    for (let i = 29; i >= 0; i--) {
      const d = subDays(today, i)
      const key = format(d, 'yyyy-MM-dd')
      data.push({ date: format(d, 'MMM d'), count: counts.get(key) || 0 })
    }
    return data
  }, [allLogs])

  const rows = useMemo(() => {
    return habits
      .map((habit) => {
        const logs = logsByHabit[habit.id] ?? []
        return {
          habit,
          streak: getCurrentStreak(logs, habit.frequency, habit.goal_target),
          best: getBestStreak(logs, habit.frequency, habit.goal_target),
          total: logs.length,
        }
      })
      .sort((a, b) => b.streak - a.streak || b.best - a.best)
  }, [habits, logsByHabit])

  if (loading) return <p className="text-ink-faint text-sm">Loading…</p>

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-6">Statistics</h1>

      <section className="bg-paper-dim border border-line rounded-card shadow-card p-5 mb-6">
        <h2 className="font-display text-lg text-ink mb-4">All marks, last 30 days</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTotals} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="statsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-moss)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-moss)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }}
                axisLine={{ stroke: 'var(--color-line)' }}
                tickLine={false}
                interval={4}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-paper)',
                  border: '1px solid var(--color-line)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-moss)"
                strokeWidth={2}
                fill="url(#statsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-paper-dim border border-line rounded-card shadow-card overflow-hidden">
        <h2 className="font-display text-lg text-ink p-5 pb-3">Habits by current streak</h2>
        {rows.length === 0 ? (
          <p className="text-ink-faint text-sm px-5 pb-5">No habits yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-line text-ink-faint text-xs uppercase tracking-wide">
                  <th className="text-left font-medium px-5 py-2">Habit</th>
                  <th className="text-left font-medium px-3 py-2">Streak</th>
                  <th className="text-left font-medium px-3 py-2">Record</th>
                  <th className="text-left font-medium px-3 py-2">Total marks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ habit, streak, best, total }) => (
                  <tr key={habit.id} className="border-t border-line hover:bg-paper-deep/50">
                    <td className="px-5 py-3">
                      <Link
                        to={`/habits/${habit.id}`}
                        className="flex items-center gap-2 font-medium text-ink hover:underline"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: habit.color }}
                        />
                        {habit.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <TallyMarks count={streak} color={habit.color} />
                    </td>
                    <td className="px-3 py-3 font-mono-num text-ink-soft">{best}</td>
                    <td className="px-3 py-3 font-mono-num text-ink-soft">{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
