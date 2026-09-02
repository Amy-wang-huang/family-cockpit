'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      if (error.message === 'Email not confirmed') {
        setError('注册成功！请先去邮箱点确认链接（可能在垃圾邮件里），再回来登录。')
        setIsSignUp(false)
      } else {
        setError(error.message)
      }
      return
    }

    if (isSignUp) {
      if (data.session) {
        router.replace('/')
        router.refresh()
        return
      }
      setError('注册成功！请去邮箱点确认链接（可能在垃圾邮件里），然后登录。')
      setIsSignUp(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-100 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-gray-800">家庭驾驶舱</h1>
          <p className="text-sm text-gray-500 mt-2">全家的记忆与关爱，一个舱看清</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {error && <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '请稍候…' : isSignUp ? '注册' : '登录'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="w-full text-sm text-gray-500 hover:text-orange-500"
          >
            {isSignUp ? '已有账号？点此登录' : '没有账号？点此注册'}
          </button>
        </form>
      </div>
    </main>
  )
}
