import { useState } from 'react'
import { CalendarClock, Check } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { todayStr } from '../utils/streaks'

/** Small popover for marking a habit done/not-done on a day other than today. */
export default function BackdateMenu({ habit, logs, onToggleDate }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'))
  const today = todayStr()
  const done = logs.includes(date)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Mark a past day"
        aria-label="Mark a past day"
        className="p-1.5 rounded-lg text-ink-faint hover:bg-paper-deep hover:text-ink transition-colors cursor-pointer"
      >
        <CalendarClock size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 bg-paper border border-line rounded-lg shadow-card-hover p-3 w-56">
            <p className="text-xs text-ink-faint font-medium mb-2">Mark a past day</p>
            <input
              type="date"
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mb-2 rounded-lg border border-line bg-paper-dim px-2 py-1.5 text-sm text-ink outline-none focus:border-moss focus:ring-1 focus:ring-moss font-mono-num"
            />
            <button
              type="button"
              onClick={() => onToggleDate(habit, date)}
              className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                done
                  ? 'bg-moss text-paper hover:bg-moss-dark'
                  : 'border border-line text-ink-soft hover:bg-paper-deep'
              }`}
            >
              <Check size={14} />
              {done ? 'Marked done — click to unmark' : 'Mark done'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
