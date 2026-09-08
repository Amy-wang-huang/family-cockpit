import { createClient } from '@supabase/supabase-js'

// 服务级客户端：绕过 RLS，仅限 Cron 等无用户上下文的服务端任务使用
// SUPABASE_SERVICE_ROLE_KEY 只进环境变量，绝不进前端代码
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
