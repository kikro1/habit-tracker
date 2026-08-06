import { useState } from 'react'
import { X, BellRing } from 'lucide-react'
import { requestNotificationPermission } from '../utils/notifications'

const COLORS = [
  '#3f5b46', // moss
  '#6b8a70', // moss light
  '#c98a2c', // amber
  '#e3ac52', // amber light
  '#b5563a', // terracotta
  '#d17c5f', // terracotta light
  '#4a6f8a', // slate blue
  '#8a5f8a', // muted plum
]

export default function NewHabitModal({ habit, onClose, onSubmit }) {
  const isEdit = Boolean(habit)
  const [name, setName] = useState(habit?.name ?? '')
  const [description, setDescription] = useState(habit?.description ?? '')
  const [color, setColor] = useState(habit?.color ?? COLORS[0])
  const [frequency, setFrequency] = useState(habit?.frequency ?? 'daily')
  const [goalTarget, setGoalTarget] = useState(habit?.goal_target ?? 1)
  const [reminderTime, setReminderTime] = useState(habit?.reminder_time?.slice(0, 5) ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // skip autofocus on touch devices — popping the keyboard the instant the
  // modal mounts reads as a layout jump, not a helpful affordance
  const shouldAutoFocus =
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError('')

    if (reminderTime) {
      requestNotificationPermission()
    }

    const result = await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      color,
      frequency,
      goal_target: Number(goalTarget),
      reminder_time: reminderTime || null,
    })

    setSubmitting(false)

    if (result?.error) {
      setError(result.error.message || 'Something went wrong. Please try again.')
      return
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-ink/40 backdrop-blur-sm px-4 py-6 sm:py-10">
      <div className="w-full max-w-md bg-paper border border-line rounded-card shadow-card-hover p-6 my-auto max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-ink">
            {isEdit ? 'Edit habit' : 'New habit'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-ink-faint hover:bg-paper-deep hover:text-ink cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-soft font-medium">Name</span>
            <input
              type="text"
              required
              autoFocus={shouldAutoFocus}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-line bg-paper-dim px-3 py-2 text-ink outline-none focus:border-moss focus:ring-1 focus:ring-moss"
              placeholder="Morning walk"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-soft font-medium">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-lg border border-line bg-paper-dim px-3 py-2 text-ink outline-none focus:border-moss focus:ring-1 focus:ring-moss resize-none"
              placeholder="20 minutes around the block"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-soft font-medium">Color</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-offset-paper ring-ink scale-105' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft font-medium">Frequency</span>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="rounded-lg border border-line bg-paper-dim px-3 py-2 text-ink outline-none focus:border-moss focus:ring-1 focus:ring-moss"
              >
                <option value="daily">Every day</option>
                <option value="weekly">N times / week</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft font-medium">
                Goal ({frequency === 'weekly' ? 'per week' : 'per day'})
              </span>
              <input
                type="number"
                min={1}
                max={frequency === 'weekly' ? 7 : 20}
                required
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="rounded-lg border border-line bg-paper-dim px-3 py-2 text-ink outline-none focus:border-moss focus:ring-1 focus:ring-moss font-mono-num"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-soft font-medium flex items-center gap-1.5">
              <BellRing size={13} className="text-amber" />
              Reminder time (optional)
            </span>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="rounded-lg border border-line bg-paper-dim px-3 py-2 text-ink outline-none focus:border-moss focus:ring-1 focus:ring-moss font-mono-num"
            />
            {reminderTime && (
              <span className="text-xs text-ink-faint">
                Needs this tab open and browser notifications allowed.
              </span>
            )}
          </label>

          {error && (
            <p className="text-sm text-terracotta bg-terracotta-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-deep transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-moss text-paper py-2.5 text-sm font-medium shadow-card hover:bg-moss-dark transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
