import { useEffect, useState, useCallback } from 'react'
import { Plus, NotebookPen } from 'lucide-react'
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

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: habitsData }, { data: logsData }] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('habit_id, date'),
    ])

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
      await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('date', today)
      setLogsByHabit((prev) => ({
        ...prev,
        [habit.id]: (prev[habit.id] ?? []).filter((d) => d !== today),
      }))
    } else {
      await supabase.from('habit_logs').insert({
        habit_id: habit.id,
        user_id: user.id,
        date: today,
      })
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
    if (!error && data) {
      setHabits((prev) => [...prev, data])
    }
    setModalOpen(false)
  }

  async function handleUpdate(values) {
    const { data, error } = await supabase
      .from('habits')
      .update(values)
      .eq('id', editingHabit.id)
      .select()
      .single()
    if (!error && data) {
      setHabits((prev) => prev.map((h) => (h.id === data.id ? data : h)))
    }
    setEditingHabit(null)
  }

  async function handleDelete(habit) {
    if (!window.confirm(`Delete "${habit.name}"? This removes all its history too.`)) return
    await supabase.from('habits').delete().eq('id', habit.id)
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
