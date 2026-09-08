// 提醒引擎 · 纯函数（D3 排序展示 + D4 提醒窗口共用，单测只测这里）

export type Recurrence = 'none' | 'yearly' | 'monthly' | 'weekly' | 'daily'

export function todayStr(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseLocal(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function lastDayOf(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

/**
 * 事件的下次发生日期（本地时区，忽略闰日差异按 JS Date 规则处理）
 * - none：返回 start_date 本身（是否已过由调用方用 daysUntil 判断）
 * - yearly：今年同月日，已过则明年
 * - monthly/weekly：从 start 起推到 >= from 的第一个发生日
 * - daily：from 当天
 */
export function nextOccurrence(
  start: string,
  recurrence: string,
  from: string = todayStr()
): string {
  const sd = parseLocal(start)
  const fd = parseLocal(from)
  const rec = recurrence as Recurrence

  if (rec === 'none' || sd >= fd) return start

  switch (rec) {
    case 'daily':
      return from
    case 'weekly': {
      const diff = Math.ceil((fd.getTime() - sd.getTime()) / 86400000)
      const weeks = Math.ceil(diff / 7)
      return fmtLocal(new Date(sd.getTime() + weeks * 7 * 86400000))
    }
    case 'monthly': {
      // 按月差直接定位，不能逐月递增——否则 1/31 → 2/28 后日号被污染，3 月会算成 3/28
      const day = sd.getDate()
      let d = new Date(fd.getFullYear(), fd.getMonth(), Math.min(day, lastDayOf(fd.getFullYear(), fd.getMonth())))
      if (d < fd) {
        const m = fd.getMonth() + 1
        d = new Date(fd.getFullYear(), m, Math.min(day, lastDayOf(fd.getFullYear(), m)))
      }
      return fmtLocal(d)
    }
    case 'yearly':
    default: {
      let d = new Date(fd.getFullYear(), sd.getMonth(), sd.getDate())
      if (d < fd) d = new Date(fd.getFullYear() + 1, sd.getMonth(), sd.getDate())
      return fmtLocal(d)
    }
  }
}

/** 距离天数：目标日在 from 之后为正数，当天为 0 */
export function daysUntil(target: string, from: string = todayStr()): number {
  return Math.round(
    (parseLocal(target).getTime() - parseLocal(from).getTime()) / 86400000
  )
}

export interface ReminderSource {
  id: string
  start_date: string
  recurrence: string
  advance_days: number
  is_active: boolean
}

export interface ReminderDraft {
  sourceId: string
  nextDate: string
  daysLeft: number
}

/**
 * 提醒窗口：事件下次发生日进入 advance_days 提前量内即提醒
 * 返回 null 表示不在窗口内（或事件已停用 / 一次性事件已过期）
 */
export function buildReminder(
  source: ReminderSource,
  from: string = todayStr()
): ReminderDraft | null {
  if (!source.is_active) return null

  const next = nextOccurrence(source.start_date, source.recurrence, from)
  const daysLeft = daysUntil(next, from)

  if (source.recurrence === 'none' && daysLeft < 0) return null
  if (daysLeft > source.advance_days || daysLeft < 0) return null

  return { sourceId: source.id, nextDate: next, daysLeft }
}
