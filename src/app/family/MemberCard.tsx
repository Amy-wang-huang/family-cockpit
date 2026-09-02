'use client'

import { useState, useTransition } from 'react'
import MemberForm from './MemberForm'
import { deleteMember } from './actions'
import type { Member } from '@/lib/types'

function avatarOf(m: Member): string {
  if (m.role === 'pet') return '🐾'
  if (m.role === 'child') return m.gender === 'male' ? '👦' : '👧'
  if (m.role === 'admin') return '🏠'
  return m.gender === 'male' ? '👨' : m.gender === 'female' ? '👩' : '👤'
}

function ageOf(birthday: string | null): string {
  if (!birthday) return ''
  const b = new Date(birthday)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const beforeBirthday =
    now.getMonth() < b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
  if (beforeBirthday) age--
  return `${age} 岁`
}

function nextBirthdayIn(birthday: string | null): string {
  if (!birthday) return ''
  const b = new Date(birthday)
  const now = new Date()
  const next = new Date(now.getFullYear(), b.getMonth(), b.getDate())
  if (next < now) next.setFullYear(now.getFullYear() + 1)
  const days = Math.ceil((next.getTime() - now.getTime()) / 86400000)
  if (days === 0) return '🎂 今天生日！'
  if (days <= 30) return `🎂 ${days} 天后生日`
  return ''
}

export default function MemberCard({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`确定删除「${member.name}」的档案吗？`)) return
    setDeleting(true)
    startTransition(async () => {
      const res = await deleteMember(member.id)
      if (res?.error) alert(res.error)
      setDeleting(false)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-orange-100 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{avatarOf(member)}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800">{member.name}</span>
              {member.relation && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{member.relation}</span>
              )}
              {member.constitution && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{member.constitution}</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1 flex gap-2 flex-wrap">
              {member.birthday && (
                <span>{member.birthday.slice(5).replace('-', '月')}日 · {ageOf(member.birthday)}</span>
              )}
              {member.phone && <span>📞 {member.phone}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            {editing ? '收起' : '编辑'}
          </button>
          {member.role !== 'admin' && (
            <button
              onClick={handleDelete}
              disabled={deleting || pending}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 disabled:opacity-50"
            >
              {deleting ? '删除中…' : '删除'}
            </button>
          )}
        </div>
      </div>

      {nextBirthdayIn(member.birthday) && (
        <p className="mt-2 text-xs text-orange-500">{nextBirthdayIn(member.birthday)}</p>
      )}

      {(member.tags?.length || member.taboos?.length || member.note) && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
          {!!member.tags?.length && (
            <div className="flex gap-1.5 flex-wrap">
              {member.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700">#{t}</span>
              ))}
            </div>
          )}
          {!!member.taboos?.length && (
            <div className="flex gap-1.5 flex-wrap">
              {member.taboos.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600">忌 {t}</span>
              ))}
            </div>
          )}
          {member.note && <p className="text-xs text-gray-400">{member.note}</p>}
        </div>
      )}

      {editing && (
        <div className="mt-4 pt-4 border-t border-orange-50">
          <MemberForm member={member} onDone={() => setEditing(false)} />
        </div>
      )}
    </div>
  )
}
