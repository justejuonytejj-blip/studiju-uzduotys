const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseDateOnly(value) {
  const match = String(value || '')
    .slice(0, 10)
    .match(DATE_ONLY)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  return { year, month, day }
}

function localTodayParts() {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  }
}

function calendarDaysFromToday(parts) {
  const today = localTodayParts()
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day)
  const dueUtc = Date.UTC(parts.year, parts.month - 1, parts.day)
  return Math.round((dueUtc - todayUtc) / MS_PER_DAY)
}

export function toDateInputValue(value) {
  const parts = parseDateOnly(value)
  if (!parts) {
    return ''
  }

  const month = String(parts.month).padStart(2, '0')
  const day = String(parts.day).padStart(2, '0')
  return `${parts.year}-${month}-${day}`
}

export function toDueDatePayload(value) {
  const normalized = toDateInputValue(value)
  return normalized || null
}

export function formatDueDateLt(value) {
  const parts = parseDateOnly(value)
  if (!parts) {
    return ''
  }

  return new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getDueDateWarning({ dueDate, isCompleted }) {
  if (isCompleted) {
    return null
  }

  const parts = parseDateOnly(dueDate)
  if (!parts) {
    return null
  }

  const days = calendarDaysFromToday(parts)
  if (days < 0) {
    return 'overdue'
  }
  if (days <= 3) {
    return 'upcoming'
  }
  return null
}
