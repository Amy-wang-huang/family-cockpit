import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { nextOccurrence, todayStr } from '@/lib/reminders/engine'
import EventCard from './EventCard'
import EventForm from './EventForm'
import type { FamilyEvent, Member } from '@/lib/types'

export default async function EventsPage() {
  const supabase = await createClient()

  const [{ data: events }, { data: members }] = await Promise.all([
    supabase
      .from('events')
      .select('id, member_id, type, title, start_date, recurrence, advance_days, is_active, note')
      .order('created_at', { ascending: true }),
    supabase.from('members').select('id, name').order('created_at', { ascending: true }),
  ])

  const memberMap = new Map(((members ?? []) as Member[]).map((m) => [m.id, m.name]))
  const memberOptions = ((members ?? []) as Member[]).map((m) => ({ id: m.id, name: m.name }))

  const today = todayStr()
  const list = ((events ?? []) as FamilyEvent[])
    .map((e) => ({
      event: e,
      sortKey: nextOccurrence(e.start_date, e.recurrence, today),
      active: e.is_active,
    }))
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1
      return a.sortKey.localeCompare(b.sortKey)
    })

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-400 hover:text-orange-500 text-lg">←</Link>
          <h1 className="text-xl font-bold text-gray-800">提醒事项</h1>
        </div>
        <span className="text-xs text-gray-400">共 {list.length} 项</span>
      </header>

      <section className="space-y-3 my-4">
        {list.length === 0 && (
          <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center text-sm text-gray-400">
            还没有提醒事项，在下方添加第一个吧——生日、体检、缴费、给爸妈打电话
          </div>
        )}
        {list.map(({ event }) => (
          <EventCard
            key={event.id}
            event={event}
            memberName={event.member_id ? (memberMap.get(event.member_id) ?? null) : null}
            members={memberOptions}
          />
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-orange-100 p-5 my-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">➕ 添加提醒事项</h2>
        <EventForm members={memberOptions} />
      </section>

      <p className="text-center text-xs text-gray-400 mt-6">
        到期前会自动出现在首页「本周提醒」 · 数据只对你的家庭可见
      </p>
    </main>
  )
}
