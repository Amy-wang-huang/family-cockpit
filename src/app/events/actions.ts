'use server'

import { revalidatePath } from 'next/cache'
import { getFamilyId } from '@/lib/supabase/family'

export interface EventInput {
  eventId?: string
  memberId: string
  type: string
  title: string
  startDate: string
  recurrence: string
  advanceDays: string
  note: string
}

function parseInput(formData: FormData): EventInput {
  return {
    eventId: (formData.get('eventId') as string) || undefined,
    memberId: (formData.get('memberId') as string) || '',
    type: (formData.get('type') as string) || 'other',
    title: ((formData.get('title') as string) || '').trim(),
    startDate: (formData.get('startDate') as string) || '',
    recurrence: (formData.get('recurrence') as string) || 'none',
    advanceDays: (formData.get('advanceDays') as string) || '1',
    note: ((formData.get('note') as string) || '').trim(),
  }
}

export async function saveEvent(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const input = parseInput(formData)
  if (!input.title) return { error: '请填写事项名称' }
  if (!input.startDate) return { error: '请选择日期' }

  const advance = Math.max(0, Math.min(90, parseInt(input.advanceDays, 10) || 1))

  const { supabase, familyId } = await getFamilyId()

  const row = {
    family_id: familyId,
    member_id: input.memberId || null,
    type: input.type,
    title: input.title,
    start_date: input.startDate,
    recurrence: input.recurrence,
    advance_days: advance,
    note: input.note || null,
  }

  const { error } = input.eventId
    ? await supabase.from('events').update(row).eq('id', input.eventId)
    : await supabase.from('events').insert(row)

  if (error) return { error: error.message }

  revalidatePath('/events')
  revalidatePath('/')
  return { ok: true }
}

export async function deleteEvent(eventId: string): Promise<{ error?: string } | null> {
  const { supabase } = await getFamilyId()
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return { error: error.message }
  revalidatePath('/events')
  revalidatePath('/')
  return null
}

export async function toggleEvent(
  eventId: string,
  isActive: boolean
): Promise<{ error?: string } | null> {
  const { supabase } = await getFamilyId()
  const { error } = await supabase
    .from('events')
    .update({ is_active: isActive })
    .eq('id', eventId)
  if (error) return { error: error.message }
  revalidatePath('/events')
  revalidatePath('/')
  return null
}
