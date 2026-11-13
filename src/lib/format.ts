import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export const APP_TIMEZONE = 'Asia/Shanghai'

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return dayjs(iso).format('YYYY-MM-DD')
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return dayjs(iso).format('HH:mm')
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  const value = dayjs(iso)
  const now = dayjs()
  const diffMinutes = now.diff(value, 'minute')

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`

  const diffHours = now.diff(value, 'hour')
  if (diffHours < 24 && now.isSame(value, 'day')) {
    return `${diffHours} 小时前`
  }
  if (now.subtract(1, 'day').isSame(value, 'day')) return '昨天'
  if (now.isSame(value, 'year')) return value.format('MM-DD')
  return value.format('YYYY-MM-DD')
}

export function formatDuration(minutes: number): string {
  if (!minutes) return '未记录'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} 分钟`
  if (rest === 0) return `${hours} 小时`
  return `${hours} 小时 ${rest} 分钟`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function initialOf(name: string | null | undefined): string {
  return name?.trim().charAt(0) || '?'
}

/** Next dates (YYYY-MM-DD) whose weekday matches `weekday` (1=Mon … 7=Sun). */
export function upcomingDatesForWeekday(weekday: number, days = 21): string[] {
  const dates: string[] = []
  const start = dayjs().tz(APP_TIMEZONE).startOf('day')
  for (let offset = 0; offset < days; offset += 1) {
    const date = start.add(offset, 'day')
    // dayjs: Sunday = 0, Monday = 1 … Saturday = 6
    const isoWeekday = date.day() === 0 ? 7 : date.day()
    if (isoWeekday === weekday) dates.push(date.format('YYYY-MM-DD'))
  }
  return dates
}

/** A slot's wall-clock time in the app timezone → UTC ISO instant. */
export function slotToUtcIso(date: string, time: string): string {
  return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', APP_TIMEZONE).toISOString()
}

export function isPastInstant(iso: string): boolean {
  return dayjs(iso).isBefore(dayjs())
}

export function todayLabel(): string {
  const now = dayjs()
  const weekday = now.day() === 0 ? '周日' : `周${'一二三四五六日'[now.day() - 1]}`
  return `${now.format('M 月 D 日')} · ${weekday}`
}
