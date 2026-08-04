import { Link } from 'react-router-dom'
import { Check, Flame, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import TallyMarks from './TallyMarks'

export default function HabitCard({ habit, doneToday, streak, onToggle, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const frequencyLabel =
    habit.frequency === 'weekly'
      ? `${habit.goal_target}× / week`
      : habit.goal_target > 1
        ? `${habit.goal_target}× / day`
        : 'Every day'

  return (
    <div className="group bg-paper-dim border border-line rounded-card p-4 shadow-card hover:shadow-card-hover transition-shadow relative">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={doneToday}
          title={doneToday ? 'Mark not done' : 'Mark done today'}
          className={`shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
            doneToday
              ? 'text-paper shadow-card'
              : 'bg-paper text-transparent hover:text-ink-faint/40'
          }`}
          style={{
            borderColor: habit.color,
            backgroundColor: doneToday ? habit.color : undefined,
          }}
        >
          <Check size={20} strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <Link to={`/habits/${habit.id}`} className="block">
            <h3 className="font-display text-lg text-ink truncate">{habit.name}</h3>
          </Link>
          {habit.description && (
            <p className="text-sm text-ink-faint truncate mt-0.5">{habit.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${habit.color}22`, color: habit.color }}
            >
              {frequencyLabel}
            </span>
            <span className="flex items-center gap-1 text-xs text-ink-faint font-mono-num">
              <Flame size={13} className="text-amber" />
              {streak} day{streak === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-ink-faint hover:bg-paper-deep hover:text-ink transition-colors cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 bg-paper border border-line rounded-lg shadow-card-hover py-1 w-32">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-deep cursor-pointer"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-terracotta hover:bg-terracotta-50 cursor-pointer"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 pl-14">
        <TallyMarks count={streak} color={habit.color} />
      </div>
    </div>
  )
}
