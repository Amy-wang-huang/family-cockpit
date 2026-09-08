import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildReminder, todayStr } from '@/lib/reminders/engine'
import type { FamilyEvent } from '@/lib/types'

type CronEvent = FamilyEvent & { family_id: string }

// Vercel 服务器时区是 UTC，提醒日期按北京时间（UTC+8）计算
function beijingToday(): string {
  return todayStr(new Date(Date.now() + 8 * 3600_000))
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY 未配置' }, { status: 500 })
  }

  const today = beijingToday()
  const db = createAdminClient()

  // 扫全部家庭的启用事件——这次查询本身就是 Supabase 每日保活
  const { data: events, error } = await db
    .from('events')
    .select('id, family_id, member_id, type, title, start_date, recurrence, advance_days, is_active')
    .eq('is_active', true)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const drafts = ((events ?? []) as CronEvent[])
    .map((e) => ({ e, r: buildReminder(e, today) }))
    .filter((x) => x.r !== null)

  if (drafts.length > 0) {
    const rows = drafts.map(({ e, r }) => ({
      family_id: e.family_id,
      event_id: e.id,
      member_id: e.member_id,
      remind_date: today,
      title: e.title,
      detail: `${e.type} · ${r!.nextDate}`,
      status: 'pending',
    }))

    const { error: upsertError } = await db
      .from('reminders')
      .upsert(rows, { onConflict: 'event_id,remind_date', ignoreDuplicates: true })
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }
  }

  // 预留：飞书群机器人推送口，配了 FEISHU_WEBHOOK_URL 就生效
  const webhook = process.env.FEISHU_WEBHOOK_URL
  let pushed = false
  if (webhook && drafts.length > 0) {
    const lines = drafts
      .slice(0, 8)
      .map(({ e, r }) => `${r!.daysLeft === 0 ? '‼️今天' : `⏰${r!.daysLeft}天后`} ${e.title}（${r!.nextDate.slice(5).replace('-', '/')}）`)
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_type: 'text',
          content: { text: `【家庭驾驶舱】${today} 提醒\n${lines.join('\n')}` },
        }),
      })
      pushed = true
    } catch {
      // 推送失败不影响落地，下次 Cron 重试
    }
  }

  return NextResponse.json({
    ok: true,
    date: today,
    scanned: events?.length ?? 0,
    inWindow: drafts.length,
    pushed,
  })
}
