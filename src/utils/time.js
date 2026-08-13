/** Habits store reminder_time as a UTC wall-clock time (no timezone column),
 * converted from the browser's local time at save time. This drifts by up to
 * an hour across DST transitions — an accepted tradeoff for a personal app. */

export function localTimeToUtc(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString().slice(11, 19)
}

export function utcTimeToLocal(hhmmss) {
  if (!hhmmss) return ''
  const [h, m] = hhmmss.split(':').map(Number)
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0))
  return d.toTimeString().slice(0, 5)
}
