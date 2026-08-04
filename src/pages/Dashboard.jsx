import { useEffect, useState, useCallback } from 'react'
import { Plus, NotebookPen, TriangleAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import HabitCard from '../components/HabitCard'
import NewHabitModal from '../components/NewHabitModal'
import { getCurrentStreak, todayStr } from '../utils/streaks'

export default function Dashboard() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [logsByHabit, setLogsByHabit] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [banner, setBanner] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: habitsData, error: habitsError }, { data: logsData, error: logsError }] =
      await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('archived', false)
          .order('created_at', { ascending: true }),
        supabase.from('habit_logs').select('habit_id, date'),
      ])

    if (habitsError || logsError) {
      setBanner((habitsError || logsError).message)
    }

    setHabits(habitsData ?? [])

    const grouped = {}
    for (const log of logsData ?? []) {
      if (!grouped[log.habit_id]) grouped[log.habit_id] = []
      grouped[log.habit_id].push(log.date)
    }
    setLogsByHabit(grouped)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleToggle(habit) {
    const today = todayStr()
    const currentLogs = logsByHabit[habit.id] ?? []
    const doneToday = currentLogs.includes(today)

    if (doneToday) {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habit.id)
        .eq('date', today)
      if (error) {
        setBanner(error.message)
        return
      }
      setLogsByHabit((prev) => ({
        ...prev,
        [habit.id]: (prev[habit.id] ?? []).filter((d) => d !== today),
      }))
    } else {
      const { error } = await supabase.from('habit_logs').insert({
        habit_id: habit.id,
        user_id: user.id,
        date: today,
      })
      if (error) {
        setBanner(error.message)
        return
      }
      setLogsByHabit((prev) => ({
        ...prev,
        [habit.id]: [...(prev[habit.id] ?? []), today],
      }))
    }
  }

  async function handleCreate(values) {
    const { data, error } = await supabase
      .from('habits')
      .insert({ ...values, user_id: user.id })
      .select()
      .single()
    if (error) return { error }
    setHabits((prev) => [...prev, data])
    return {}
  }

  async function handleUpdate(values) {
    const { data, error } = await supabase
      .from('habits')
      .update(values)
      .eq('id', editingHabit.id)
      .select()
      .single()
    if (error) return { error }
    setHabits((prev) => prev.map((h) => (h.id === data.id ? data : h)))
    return {}
  }

  async function handleDelete(habit) {
    if (!window.confirm(`Delete "${habit.name}"? This removes all its history too.`)) return
    const { error } = await supabase.from('habits').delete().eq('id', habit.id)
    if (error) {
      setBanner(error.message)
      return
    }
    setHabits((prev) => prev.filter((h) => h.id !== habit.id))
  }

  const today = todayStr()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Today</h1>
          <p className="text-ink-faint text-sm mt-1 font-mono-num">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-moss text-paper px-4 py-2.5 text-sm font-medium shadow-card hover:bg-moss-dark transition-colors cursor-pointer"
        >
          <Plus size={16} />
          New habit
        </button>
      </div>

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

      {loading ? (
        <p className="text-ink-faint text-sm">Loading…</p>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-line rounded-card">
          <NotebookPen size={28} className="text-ink-faint mb-3" />
          <p className="text-ink-soft font-medium">No habits yet</p>
          <p className="text-ink-faint text-sm mt-1">Start your field log with your first habit.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {habits.map((habit) => {
            const logs = logsByHabit[habit.id] ?? []
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                doneToday={logs.includes(today)}
                streak={getCurrentStreak(logs, habit.frequency, habit.goal_target)}
                onToggle={() => handleToggle(habit)}
                onEdit={() => setEditingHabit(habit)}
                onDelete={() => handleDelete(habit)}
              />
            )
          })}
        </div>
      )}

      {modalOpen && (
        <NewHabitModal onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      )}
      {editingHabit && (
        <NewHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  )
}
