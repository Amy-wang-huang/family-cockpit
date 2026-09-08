export const EVENT_TYPE_META: Record<string, { icon: string; label: string }> = {
  birthday: { icon: '🎂', label: '生日' },
  call: { icon: '📞', label: '电话' },
  checkup: { icon: '🩺', label: '体检' },
  bill: { icon: '💳', label: '缴费' },
  vaccine: { icon: '💉', label: '疫苗' },
  festival: { icon: '🏮', label: '节日' },
  meeting: { icon: '🗓️', label: '会议' },
  other: { icon: '📌', label: '其他' },
}

export function eventMeta(type: string) {
  return EVENT_TYPE_META[type] ?? EVENT_TYPE_META.other
}
