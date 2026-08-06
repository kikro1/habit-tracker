import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { ArrowLeft, Flame, Trophy, TrendingUp, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TallyMarks from '../components/TallyMarks'
import NewHabitModal from '../components/NewHabitModal'
import {
  getCurrentStreak,
  getBestStreak,
  getCompletionRate,
  getWeeklyChartData,
  heatmapStartDate,
  isFutureDate,
  todayStr,
} from '../utils/streaks'

export default function HabitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [habit, setHabit] = useState(null)
  const [logDates, setLogDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [banner, setBanner] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: habitData, error: habitError }, { data: logsData, error: logsError }] =
      await Promise.all([
        supabase.from('habits').select('*').eq('id', id).single(),
        supabase.from('habit_logs').select('date').eq('habit_id', id),
      ])
    if (habitError || logsError) setBanner((habitError || logsError).message)
    setHabit(habitData ?? null)
    setLogDates((logsData ?? []).map((l) => l.date))
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const logSet = useMemo(() => new Set(logDates), [logDates])

  async function toggleDate(dateStr) {
    if (isFutureDate(dateStr)) return
    if (logSet.has(dateStr)) {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', id)
        .eq('date', dateStr)
      if (error) return setBanner(error.message)
      setLogDates((prev) => prev.filter((d) => d !== dateStr))
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .insert({ habit_id: id, user_id: user.id, date: dateStr })
      if (error) return setBanner(error.message)
      setLogDates((prev) => [...prev, dateStr])
    }
  }

  async function handleUpdate(values) {
    const { data, error } = await supabase
      .from('habits')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (error) return { error }
    setHabit(data)
    return {}
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${habit.name}"? This removes all its history too.`)) return
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) return setBanner(error.message)
    navigate('/')
  }

  if (loading) return <p className="text-ink-faint text-sm">Loading…</p>
  if (!habit) return <p className="text-ink-faint text-sm">Habit not found.</p>

  const streak = getCurrentStreak(logDates, habit.frequency, habit.goal_target)
  const best = getBestStreak(logDates, habit.frequency, habit.goal_target)
  const completion = getCompletionRate(logDates, 30)
  const weeklyData = getWeeklyChartData(logDates, 12)
  const heatmapValues = logDates.map((date) => ({ date, count: 1 }))
  const today = todayStr()

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-6"
      >
        <ArrowLeft size={15} /> Back to today
      </Link>

      {banner && (
        <div className="flex items-start gap-2 text-sm text-terracotta bg-terracotta-50 rounded-lg px-3 py-2 mb-4">
          <TriangleAlert size={15} className="shrink-0 mt-0.5" />
          <span className="flex-1">{banner}</span>
          <button
            type="button"
            onClick={() => setBanner('')}
            className="text-terracotta/70 hover:text-terracotta cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-4 h-4 rounded-full shrink-0 mt-1.5"
            style={{ backgroundColor: habit.color }}
          />
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl text-ink break-words">
              {habit.name}
            </h1>
            {habit.description && (
              <p className="text-ink-faint text-sm mt-1 break-words">{habit.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-2 rounded-lg text-ink-soft hover:bg-paper-deep transition-colors cursor-pointer"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 rounded-lg text-terracotta hover:bg-terracotta-50 transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
        <StatCard icon={Flame} label="Current streak" color="var(--color-amber)">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
            <span className="font-mono-num text-xl sm:text-3xl text-ink shrink-0">{streak}</span>
            <TallyMarks count={streak} color={habit.color} />
          </div>
        </StatCard>
        <StatCard icon={Trophy} label="Best streak" color="var(--color-moss)">
          <span className="font-mono-num text-xl sm:text-3xl text-ink">{best}</span>
        </StatCard>
        <StatCard icon={TrendingUp} label="Last 30 days" color="var(--color-terracotta)">
          <span className="font-mono-num text-xl sm:text-3xl text-ink">{completion}%</span>
        </StatCard>
      </div>

      <section className="bg-paper-dim border border-line rounded-card shadow-card p-5 mb-6">
        <h2 className="font-display text-lg text-ink mb-4">Last 6 months</h2>
        <div className="habit-heatmap overflow-x-auto" style={{ '--habit-color': habit.color }}>
          <CalendarHeatmap
            startDate={heatmapStartDate(6)}
            endDate={new Date()}
            values={heatmapValues}
            showWeekdayLabels
            classForValue={(value) => {
              if (!value) return 'color-empty'
              if (isFutureDate(value.date)) return 'color-future'
              return 'color-scale-3'
            }}
            onClick={(value) => {
              const dateStr = value?.date ?? today
              toggleDate(dateStr)
            }}
            tooltipDataAttrs={(value) => ({ title: value?.date ?? '' })}
          />
        </div>
      </section>

      <section className="bg-paper-dim border border-line rounded-card shadow-card p-5">
        <h2 className="font-display text-lg text-ink mb-4">Marks per week (12 weeks)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }}
                axisLine={{ stroke: 'var(--color-line)' }}
                tickLine={false}
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
              <Bar dataKey="count" fill={habit.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {editing && (
        <NewHabitModal habit={habit} onClose={() => setEditing(false)} onSubmit={handleUpdate} />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, color, children }) {
  return (
    <div className="bg-paper-dim border border-line rounded-card shadow-card p-3 sm:p-4 min-w-0">
      <div className="flex items-center gap-1.5 text-xs text-ink-faint font-medium mb-2 truncate">
        <Icon size={13} className="shrink-0" style={{ color }} />
        {label}
      </div>
      {children}
    </div>
  )
}
