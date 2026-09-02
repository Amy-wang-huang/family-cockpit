import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/LogoutButton'

const modules = [
  { icon: '👤', name: '成员档案', desc: '全家人的档案与生日提醒', ready: true },
  { icon: '❤️', name: '父母健康', desc: '体检、用药、电话提醒', ready: true },
  { icon: '🌱', name: '孩子成长', desc: '学习、记录、教育支出', ready: true },
  { icon: '🧧', name: '人情往来', desc: '份子钱台账、收送统计', ready: true },
  { icon: '💰', name: '家账', desc: '日常开支分析', ready: false },
  { icon: '📖', name: '家记', desc: '大事记、旅行足迹', ready: false },
  { icon: '🏮', name: '家风', desc: '家训、家庭会议', ready: false },
  { icon: '🍳', name: '家事', desc: '每周菜单、体质饮食', ready: false },
]

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <h1 className="text-xl font-bold text-gray-800">家庭驾驶舱</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{user?.email}</span>
          <LogoutButton />
        </div>
      </header>

      <section className="bg-white rounded-2xl border border-orange-100 p-5 my-4">
        <h2 className="text-sm font-medium text-gray-500 mb-3">本周提醒</h2>
        <p className="text-gray-400 text-sm">暂无提醒 —— D4 提醒引擎上线后，这里会显示生日、体检、缴费等提前提醒</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {modules.map((m) => (
          <div
            key={m.name}
            className={`rounded-2xl border p-4 ${
              m.ready
                ? 'bg-white border-orange-100'
                : 'bg-white/50 border-gray-100 opacity-60'
            }`}
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="font-semibold text-gray-800 text-sm">
              {m.name}
              {!m.ready && <span className="ml-1 text-[10px] text-gray-400">敬请期待</span>}
            </div>
            <div className="text-xs text-gray-500 mt-1">{m.desc}</div>
          </div>
        ))}
      </section>

      <p className="text-center text-xs text-gray-400 mt-8">D1 · 链路已通 ✅</p>
    </main>
  )
}
