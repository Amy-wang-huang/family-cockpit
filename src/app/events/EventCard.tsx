'use client'

import { useState, useTransition } from 'react'
import EventForm from './EventForm'
import { deleteEvent, toggleEvent } from './actions'
import { daysUntil, nextOccurrence, todayStr } from '@/lib/reminders/engine'
import { eventMeta } from '@/lib/events/meta'
import type { FamilyEvent } from '@/lib/types'

const RECURRENCE_LABEL: Record<string, string> = {
  none: '仅一次',
  yearly: '每年',
  monthly: '每月',
  weekly: '每周',
  daily: '每天',
}

interface Props {
  event: FamilyEvent
  memberName: string | null
  members: { id: string; name: string }[]
}

export default function EventCard({ event, memberName, members }: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pending, startTransition] = useTransition()

  const meta = eventMeta(event.type)
  const today = todayStr()
  const next = nextOccurrence(event.start_date, event.recurrence, today)
  const daysLeft = daysUntil(next, today)

  function countdown(): { text: string; cls: string } | null {
    if (!event.is_active) return { text: '已停用', cls: 'text-gray-400' }
    if (daysLeft < 0) return { text: '已过期', cls: 'text-gray-400' }
    if (daysLeft === 0) return { text: '⏰ 就是今天！', cls: 'text-red-500 font-semibold' }
    if (daysLeft <= event.advance_days)
      return { text: `⏰ 还有 ${daysLeft} 天`, cls: 'text-orange-500' }
    return { text: `${daysLeft} 天后`, cls: 'text-gray-400' }
  }

  function handleDelete() {
    if (!confirm(`确定删除「${event.title}」吗？`)) return
    setDeleting(true)
    startTransition(async () => {
      const res = await deleteEvent(event.id)
      if (res?.error) alert(res.error)
      setDeleting(false)
    })
  }

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleEvent(event.id, !event.is_active)
      if (res?.error) alert(res.error)
    })
  }

  const cd = countdown()

  return (
    <div
      className={`bg-white rounded-2xl border p-5 ${
        event.is_active ? 'border-orange-100' : 'border-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800">{event.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {meta.label}
              </span>
              {event.recurrence !== 'none' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                  {RECURRENCE_LABEL[event.recurrence]}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1 flex gap-2 flex-wrap">
              {memberName && <span>👤 {memberName}</span>}
              <span>📅 {next}{event.recurrence === 'none' ? '' : '（下次）'}</span>
              <span>提前 {event.advance_days} 天提醒</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleToggle}
            disabled={pending}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            {event.is_active ? '停用' : '启用'}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            {editing ? '收起' : '编辑'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || pending}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 disabled:opacity-50"
          >
            {deleting ? '删除中…' : '删除'}
          </button>
        </div>
      </div>

      {cd && <p className={`mt-2 text-xs ${cd.cls}`}>{cd.text}</p>}
      {event.note && <p className="mt-2 text-xs text-gray-400">{event.note}</p>}

      {editing && (
        <div className="mt-4 pt-4 border-t border-orange-50">
          <EventForm members={members} event={event} onDone={() => setEditing(false)} />
        </div>
      )}
    </div>
  )
}
