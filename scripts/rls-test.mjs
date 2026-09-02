// D2 越权实测：注册测试账号 B，验证 RLS 家庭隔离
// 用法：node scripts/rls-test.mjs（读取项目 .env.local）
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const URL_BASE = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim()
const ANON = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim()

const EMAIL = 'cockpit-rls-test@family-cockpit.test'
const PASSWORD = 'TestD2-secure-999'
const results = []
const check = (name, ok, detail) => {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`)
}

// 1. 注册（已存在则改用登录）
let res = await fetch(`${URL_BASE}/auth/v1/signup`, {
  method: 'POST',
  headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
if (!res.ok && (await res.text()).includes('already')) {
  res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
}
const auth = await res.json()
if (!auth.access_token) {
  console.log('注册/登录失败:', JSON.stringify(auth).slice(0, 300))
  process.exit(1)
}
const B = auth.access_token
const H = { apikey: ANON, Authorization: `Bearer ${B}`, 'Content-Type': 'application/json' }
check('测试账号 B 注册并登录成功', true, EMAIL)

// 2. B 读 members 全表 → 只应看到自己的"自己"档案 1 行
const members = await (await fetch(`${URL_BASE}/rest/v1/members?select=id,name,role,relation`, { headers: H })).json()
check(
  'B 查成员表：只能看到自己家庭的 1 行',
  Array.isArray(members) && members.length === 1 && members[0].relation === '自己',
  `返回 ${Array.isArray(members) ? members.length : '?'} 行${Array.isArray(members) && members.length ? '，relation=' + members[0].relation : ''}`
)

// 3. B 读 families → 只有自己的 1 个家庭
const families = await (await fetch(`${URL_BASE}/rest/v1/families?select=id,name`, { headers: H })).json()
check('B 查家庭表：只能看到自己的 1 个家庭', Array.isArray(families) && families.length === 1, `返回 ${Array.isArray(families) ? families.length : '?'} 行`)

// 4. B 读其他业务表 → 应为 0 行（A 家的事件/账目等 B 全都看不到）
for (const t of ['events', 'records', 'money_records', 'documents', 'assets']) {
  const rows = await (await fetch(`${URL_BASE}/rest/v1/${t}?select=id`, { headers: H })).json()
  check(`B 查 ${t} 表：0 行（看不到别人家数据）`, Array.isArray(rows) && rows.length === 0)
}

// 5. B 伪造 family_id 写入（模拟越权攻击）→ 应被 RLS 拒绝
const forged = await fetch(`${URL_BASE}/rest/v1/members`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify({ family_id: crypto.randomUUID(), name: '黑客' }),
})
check('B 伪造别人家庭 ID 写入成员：被拒绝', !forged.ok, `HTTP ${forged.status}`)

// 6. B 伪造 family_id 写入账目 → 应被 RLS 拒绝
const forged2 = await fetch(`${URL_BASE}/rest/v1/money_records`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify({ family_id: crypto.randomUUID(), direction: 'in', counterparty: '黑客', amount: 1 }),
})
check('B 伪造别人家庭 ID 写入账目：被拒绝', !forged2.ok, `HTTP ${forged2.status}`)

const failed = results.filter((r) => !r.ok)
console.log(`\n${failed.length === 0 ? '🎉 全部通过' : '⚠️ ' + failed.length + ' 项失败'}（共 ${results.length} 项）`)
process.exit(failed.length === 0 ? 0 : 1)
