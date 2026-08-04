import {
  startOfDay,
  startOfWeek,
  subDays,
  subWeeks,
  isBefore,
  isEqual,
  differenceInCalendarDays,
  format,
} from 'date-fns'

/**
 * All streak/stat helpers take `logDates`: an array of 'yyyy-MM-dd' strings
 * (the `date` column from habit_logs) for a single habit.
 */

function toDateSet(logDates) {
  return new Set(logDates)
}

function toWeekKey(dateStr) {
  return format(startOfWeek(new Date(dateStr), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

/** Count of logs falling in each ISO-ish week (Mon start), keyed by week start date string. */
function countsByWeek(logDates) {
  const counts = new Map()
  for (const d of logDates) {
    const key = toWeekKey(d)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}

/**
 * Current streak.
 * - daily: consecutive days with a log, walking back from today (streak survives
 *   if today isn't logged yet but yesterday was — it's still "alive").
 * - weekly: consecutive weeks (Mon-Sun) where log count >= goalTarget, walking
 *   back from the current week (current week is allowed to be incomplete/in-progress).
 */
export function getCurrentStreak(logDates, frequency = 'daily', goalTarget = 1) {
  if (!logDates || logDates.length === 0) return 0
  const set = toDateSet(logDates)
  const today = startOfDay(new Date())

  if (frequency === 'weekly') {
    const counts = countsByWeek(logDates)
    let cursor = startOfWeek(today, { weekStartsOn: 1 })
    let streak = 0
    const currentWeekKey = format(cursor, 'yyyy-MM-dd')
    const currentWeekCount = counts.get(currentWeekKey) || 0

    // Current week doesn't break the streak if not yet complete; only counts if it meets goal.
    if (currentWeekCount >= goalTarget) {
      streak += 1
    }
    cursor = subWeeks(cursor, 1)

    while (true) {
      const key = format(cursor, 'yyyy-MM-dd')
      const count = counts.get(key) || 0
      if (count >= goalTarget) {
        streak += 1
        cursor = subWeeks(cursor, 1)
      } else {
        break
      }
    }
    return streak
  }

  // daily
  let cursor = today
  let streak = 0

  // if today isn't logged, start counting from yesterday instead
  if (!set.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = subDays(cursor, 1)
  }

  while (set.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }

  return streak
}

/** Best streak ever, same rules as current streak but scanning the whole history. */
export function getBestStreak(logDates, frequency = 'daily', goalTarget = 1) {
  if (!logDates || logDates.length === 0) return 0

  if (frequency === 'weekly') {
    const counts = countsByWeek(logDates)
    const weekKeys = [...counts.keys()].sort()
    let best = 0
    let current = 0
    let prevWeek = null

    for (const key of weekKeys) {
      const meetsGoal = counts.get(key) >= goalTarget
      if (!meetsGoal) {
        current = 0
        prevWeek = key
        continue
      }
      if (prevWeek !== null) {
        const expectedPrev = format(subWeeks(new Date(key), 1), 'yyyy-MM-dd')
        current = expectedPrev === prevWeek ? current + 1 : 1
      } else {
        current = 1
      }
      best = Math.max(best, current)
      prevWeek = key
    }
    return best
  }

  const sorted = [...new Set(logDates)].sort()
  let best = 0
  let current = 0
  let prevDate = null

  for (const dateStr of sorted) {
    const d = new Date(dateStr)
    if (prevDate !== null && differenceInCalendarDays(d, prevDate) === 1) {
      current += 1
    } else {
      current = 1
    }
    best = Math.max(best, current)
    prevDate = d
  }

  return best
}

/** % of the last `days` days (default 30) that have a log, 0-100 rounded. */
export function getCompletionRate(logDates, days = 30) {
  if (!logDates || logDates.length === 0) return 0
  const set = toDateSet(logDates)
  const today = startOfDay(new Date())
  let hits = 0

  for (let i = 0; i < days; i++) {
    const d = subDays(today, i)
    if (set.has(format(d, 'yyyy-MM-dd'))) hits += 1
  }

  return Math.round((hits / days) * 100)
}

/** Bar-chart data: number of logs per week for the last `weeks` weeks (oldest first). */
export function getWeeklyChartData(logDates, weeks = 12) {
  const counts = countsByWeek(logDates)
  const today = startOfDay(new Date())
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
  const data = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = subWeeks(thisWeekStart, i)
    const key = format(weekStart, 'yyyy-MM-dd')
    data.push({
      week: format(weekStart, 'MMM d'),
      count: counts.get(key) || 0,
    })
  }

  return data
}

export function heatmapStartDate(months = 6) {
  const today = startOfDay(new Date())
  const d = new Date(today)
  d.setMonth(d.getMonth() - months)
  return d
}

export function isFutureDate(dateStr) {
  const today = startOfDay(new Date())
  const d = startOfDay(new Date(dateStr))
  return isBefore(today, d) && !isEqual(today, d)
}

export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}
