'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { saveEvent } from './actions'
import type { FamilyEvent } from '@/lib/types'

export const EVENT_TYPES: { value: string; label: string; icon: string; defaultRecurrence?: string }[] = [
  { value: 'birthday', label: '生日', icon: '🎂', defaultRecurrence: 'yearly' },
  { value: 'call', label: '打电话', icon: '📞', defaultRecurrence: 'weekly' },
  { value: 'checkup', label: '体检', icon: '🩺', defaultRecurrence: 'yearly' },
  { value: 'bill', label: '缴费续费', icon: '💳', defaultRecurrence: 'yearly' },
  { value: 'vaccine', label: '疫苗', icon: '💉' },
  { value: 'festival', label: '节日', icon: '🏮', defaultRecurrence: 'yearly' },
  { value: 'meeting', label: '家庭会议', icon: '🗓️', defaultRecurrence: 'monthly' },
  { value: 'other', label: '其他', icon: '📌' },
]

const RECURRENCES = [
  { value: 'none', label: '仅一次' },
  { value: 'yearly', label: '每年' },
  { value: 'monthly', label: '每月' },
  { value: 'weekly', label: '每周' },
]

interface Props {
  members: { id: string; name: string }[]
  event?: FamilyEvent
  onDone?: () => void
}

export default function EventForm({ members, event, onDone }: Props) {
  const isEdit = !!event
  const [state, formAction, pending] = useActionState(saveEvent, null)
  const formRef = useRef<HTMLFormElement>(null)
  const [type, setType] = useState(event?.type ?? 'birthday')

  useEffect(() => {
    if (state?.ok) {
      if (isEdit) onDone?.()
      else formRef.current?.reset()
    }
  }, [state, isEdit, onDone])

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 text-sm'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

  function changeType(v: string) {
    setType(v)
    const preset = EVENT_TYPES.find((t) => t.value === v)?.defaultRecurrence
    if (preset && formRef.current) {
      ;(formRef.current.elements.namedItem('recurrence') as HTMLSelectElement).value = preset
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {event && <input type="hidden" name="eventId" value={event.id} />}

      <div>
        <label className={labelCls}>类型</label>
        <div className="flex gap-1.5 flex-wrap">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => changeType(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                type === t.value
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>事项名称 *</label>
          <input
            name="title"
            required
            defaultValue={event?.title ?? ''}
            placeholder="如：妈妈生日"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>关联家人</label>
          <select name="memberId" defaultValue={event?.member_id ?? ''} className={inputCls}>
            <option value="">全家</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>日期 *</label>
          <input type="date" name="startDate" required defaultValue={event?.start_date ?? ''} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>重复</label>
          <select name="recurrence" defaultValue={event?.recurrence ?? 'yearly'} className={inputCls}>
            {RECURRENCES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>提前提醒（天）</label>
          <input type="number" name="advanceDays" min={0} max={90} defaultValue={event?.advance_days ?? 3} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>备注</label>
        <input name="note" defaultValue={event?.note ?? ''} placeholder="选填，如：礼物想法、要带的东西" className={inputCls} />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2.5">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {pending ? '保存中…' : isEdit ? '保存修改' : '添加事项'}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onDone}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}
