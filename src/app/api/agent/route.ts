import { NextResponse } from 'next/server'

// D1 预留：第三周语音助手入口（GLM 意图识别 → 白名单操作 → 确认卡片）
export async function POST(request: Request) {
  if (!process.env.GLM_API_KEY) {
    return NextResponse.json({ error: '语音助手尚未上线，敬请期待' }, { status: 501 })
  }
  return NextResponse.json({ ok: true, echo: await request.text() })
}
