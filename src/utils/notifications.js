export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function notifiedKey(habitId, dateStr) {
  return `habit-reminder-notified:${habitId}:${dateStr}`
}

export function hasNotifiedToday(habitId, dateStr) {
  return localStorage.getItem(notifiedKey(habitId, dateStr)) === '1'
}

export function markNotifiedToday(habitId, dateStr) {
  localStorage.setItem(notifiedKey(habitId, dateStr), '1')
}

export function showHabitReminder(habit) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  new Notification(`Time for: ${habit.name}`, {
    body: "It's on your Field Log for today. Tap to check it off.",
    tag: `habit-${habit.id}`,
  })
}
