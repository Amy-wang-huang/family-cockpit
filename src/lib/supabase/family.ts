import { createClient } from '@/lib/supabase/server'

// 所有 server action 共用：拿当前登录用户 + 其家庭 id（RLS 隔离入口）
export async function getFamilyId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data } = await supabase
    .from('members')
    .select('family_id')
    .eq('user_id', user.id)
    .single()
  if (!data) throw new Error('找不到你的家庭档案，请重新注册或联系管理员')
  return { supabase, familyId: data.family_id as string }
}
