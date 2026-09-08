import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buildReminder, todayStr } from '@/lib/reminders/engine'
import { eventMeta } from '@/lib/events/meta'
import type { FamilyEvent, Member } from '@/lib/types'

export default async function RemindersPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, member_id, type, title, note, start_date, recurrence, advance_days, is_active')
    .eq('is_active', true)
  const { data: members } = await supabase.from('members').select('id, name')

  const memberMap = new Map(((members ?? []) as Member[]).map((m) => [m.id, m.name]))
  const today = todayStr()

  const all = ((events ?? []) as FamilyEvent[])
    .map((e) => ({ event: e, r: buildReminder(e, today) }))
    .filter((x) => x.r !== null)
    .sort((a, b) => a.r!.daysLeft - b.r!.daysLeft)

  const groups = [
    { title: '就是今天', items: all.filter((x) => x.r!.daysLeft === 0) },
    { title: '未来 7 天', items: all.filter((x) => x.r!.daysLeft >= 1 && x.r!.daysLeft <= 7) },
    { title: '更远 · 提前准备', items: all.filter((x) => x.r!.daysLeft > 7) },
  ]

  const countToday = all.filter((x) => x.r!.daysLeft === 0).length
  const countWeek = all.filter((x) => x.r!.daysLeft >= 1 && x.r!.daysLeft <= 7).length

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
          <h1 className="text-xl font-bold text-gray-800">🔔 提醒中心</h1>
        </div>
        <Link href="/events" className="text-xs text-orange-500 hover:text-orange-600">管理事项 →</Link>
      </header>

      <section className="grid grid-cols-3 gap-3 my-4">
        <div className="bg-white rounded-2xl border border-orange-100 p-4 text-center">
          <div className={`text-2xl font-bold ${countToday > 0 ? 'text-red-500' : 'text-gray-400'}`}>{countToday}</div>
          <div className="text-xs text-gray-500 mt-1">今天</div>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{countWeek}</div>
          <div className="text-xs text-gray-500 mt-1">未来 7 天</div>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{all.length}</div>
          <div className="text-xs text-gray-500 mt-1">提醒窗口内</div>
        </div>
      </section>

      {all.length === 0 && (
        <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center my-4">
          <p className="text-gray-400 text-sm">近期没有需要操心的事</p>
          <Link href="/events" className="inline-block mt-3 text-sm text-orange-500 hover:text-orange-600">
            去添加生日、体检、缴费 →
          </Link>
        </div>
      )}

      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.title} className="my-4">
              <h2 className="text-sm font-medium text-gray-500 mb-2">{g.title}</h2>
              <ul className="bg-white rounded-2xl border border-orange-100 divide-y divide-orange-50">
                {g.items.map(({ event, r }) => {
                  const meta = eventMeta(event.type)
                  const memberName = event.member_id ? memberMap.get(event.member_id) : null
                  return (
                    <li key={event.id} className="flex items-center justify-between p-4">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-800 truncate">
                          {meta.icon} {event.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {meta.label}
                          {memberName ? ` · ${memberName}` : ''} · {r!.nextDate.slice(5).replace('-', '/')}
                        </div>
                      </div>
                      <span
                        className={`text-xs shrink-0 ml-3 ${
                          r!.daysLeft === 0
                            ? 'text-red-500 font-semibold'
                            : r!.daysLeft <= 7
                              ? 'text-orange-500'
                              : 'text-gray-400'
                        }`}
                      >
                        {r!.daysLeft === 0 ? '就是今天' : `${r!.daysLeft} 天后`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        窗口内事项实时计算 · <Link href="/events" className="text-orange-500">管理提醒事项</Link>
      </p>
    </main>
  )
}
