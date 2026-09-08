import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildReminder, daysUntil, nextOccurrence } from './engine.ts'

// ---------- nextOccurrence ----------

test('none 返回原日期（含未来日期）', () => {
  assert.equal(nextOccurrence('2026-10-01', 'none', '2026-09-08'), '2026-10-01')
})

test('yearly 今年未到 → 今年', () => {
  assert.equal(nextOccurrence('1990-12-20', 'yearly', '2026-09-08'), '2026-12-20')
})

test('yearly 今年已过 → 明年', () => {
  assert.equal(nextOccurrence('1990-01-05', 'yearly', '2026-09-08'), '2027-01-05')
})

test('yearly 今天就是发生日 → 今天', () => {
  assert.equal(nextOccurrence('1990-09-08', 'yearly', '2026-09-08'), '2026-09-08')
})

test('yearly 2/29 生日平年按 3/1 处理（JS Date 规则）', () => {
  assert.equal(nextOccurrence('2000-02-29', 'yearly', '2026-09-08'), '2027-03-01')
})

test('monthly 1/31 从 3 月看 → 3/31', () => {
  assert.equal(nextOccurrence('2026-01-31', 'monthly', '2026-03-05'), '2026-03-31')
})

test('monthly 月末钳制：1/31 → 2/28', () => {
  assert.equal(nextOccurrence('2026-01-31', 'monthly', '2026-02-01'), '2026-02-28')
})

test('monthly 恰好本月未过 → 本月', () => {
  assert.equal(nextOccurrence('2026-03-15', 'monthly', '2026-03-08'), '2026-03-15')
})

test('weekly 跨整周滚动到下周同一天', () => {
  // 2026-09-08 是周二，事件 9/1 周二开始
  assert.equal(nextOccurrence('2026-09-01', 'weekly', '2026-09-08'), '2026-09-08')
  assert.equal(nextOccurrence('2026-09-01', 'weekly', '2026-09-09'), '2026-09-15')
})

test('daily 直接返回 from 当天', () => {
  assert.equal(nextOccurrence('2026-09-01', 'daily', '2026-09-08'), '2026-09-08')
})

test('start 晚于 from 时任何周期都返回 start 本身', () => {
  assert.equal(nextOccurrence('2026-12-25', 'yearly', '2026-09-08'), '2026-12-25')
})

// ---------- daysUntil ----------

test('daysUntil 今天 0 / 明天 1 / 昨天 -1', () => {
  assert.equal(daysUntil('2026-09-08', '2026-09-08'), 0)
  assert.equal(daysUntil('2026-09-09', '2026-09-08'), 1)
  assert.equal(daysUntil('2026-09-07', '2026-09-08'), -1)
})

// ---------- buildReminder ----------

const src = (over: Partial<Parameters<typeof buildReminder>[0]> = {}) => ({
  id: 'e1',
  start_date: '2026-09-11',
  recurrence: 'none',
  advance_days: 3,
  is_active: true,
  ...over,
})

test('窗口内 → 生成提醒（边界：恰好等于提前量）', () => {
  const r = buildReminder(src(), '2026-09-08')
  assert.equal(r?.daysLeft, 3)
  assert.equal(r?.nextDate, '2026-09-11')
})

test('超出提前量 → null', () => {
  assert.equal(buildReminder(src(), '2026-09-05'), null)
})

test('发生当天 → daysLeft 0', () => {
  const r = buildReminder(src(), '2026-09-11')
  assert.equal(r?.daysLeft, 0)
})

test('一次性事件过期 → null', () => {
  assert.equal(buildReminder(src(), '2026-09-15'), null)
})

test('周期事件过期后滚动到下次年内发生 → 仍提醒', () => {
  const r = buildReminder(src({ start_date: '2026-09-05', recurrence: 'yearly' }), '2026-09-04')
  assert.equal(r?.daysLeft, 1)
})

test('停用事件 → null', () => {
  assert.equal(buildReminder(src({ is_active: false }), '2026-09-08'), null)
})
