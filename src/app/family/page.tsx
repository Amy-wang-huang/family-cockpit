import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MemberCard from './MemberCard'
import MemberForm from './MemberForm'
import type { Member } from '@/lib/types'

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('members')
    .select('id, name, role, relation, gender, birthday, constitution, phone, tags, taboos, note')
    .order('created_at', { ascending: true })

  const list = (members ?? []) as Member[]

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-400 hover:text-orange-500 text-lg">←</Link>
          <h1 className="text-xl font-bold text-gray-800">家人档案</h1>
        </div>
        <span className="text-xs text-gray-400">共 {list.length} 位成员</span>
      </header>

      <section className="space-y-3 my-4">
        {list.length === 0 && (
          <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center text-sm text-gray-400">
            还没有成员档案，在下方添加第一位家人吧
          </div>
        )}
        {list.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-orange-100 p-5 my-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">➕ 添加成员</h2>
        <MemberForm />
      </section>

      <p className="text-center text-xs text-gray-400 mt-6">
        档案只对你的家庭可见 · 数据实时加密隔离
      </p>
    </main>
  )
}
