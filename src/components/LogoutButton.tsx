'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-gray-500 hover:text-orange-500 border border-gray-200 rounded-full px-3 py-1"
    >
      退出
    </button>
  )
}
