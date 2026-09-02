'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface MemberInput {
  memberId?: string
  name: string
  role: string
  relation: string
  gender: string
  birthday: string
  constitution: string
  phone: string
  tags: string[]
  taboos: string[]
  note: string
}

async function getFamilyId() {
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

function parseInput(formData: FormData): MemberInput {
  const toList = (s: string) =>
    s
      .split(/[,，、\s]+/)
      .map((x) => x.trim())
      .filter(Boolean)

  return {
    memberId: (formData.get('memberId') as string) || undefined,
    name: ((formData.get('name') as string) || '').trim(),
    role: (formData.get('role') as string) || 'member',
    relation: (formData.get('relation') as string) || '',
    gender: (formData.get('gender') as string) || '',
    birthday: (formData.get('birthday') as string) || '',
    constitution: (formData.get('constitution') as string) || '',
    phone: ((formData.get('phone') as string) || '').trim(),
    tags: toList((formData.get('tags') as string) || ''),
    taboos: toList((formData.get('taboos') as string) || ''),
    note: ((formData.get('note') as string) || '').trim(),
  }
}

export async function saveMember(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const input = parseInput(formData)
  if (!input.name) return { error: '请填写姓名' }

  const { supabase, familyId } = await getFamilyId()

  const row = {
    family_id: familyId,
    name: input.name,
    role: input.role,
    relation: input.relation || null,
    gender: input.gender || null,
    birthday: input.birthday || null,
    constitution: input.constitution || null,
    phone: input.phone || null,
    tags: input.tags,
    taboos: input.taboos,
    note: input.note || null,
  }

  const { error } = input.memberId
    ? await supabase.from('members').update(row).eq('id', input.memberId)
    : await supabase.from('members').insert(row)

  if (error) return { error: error.message }

  revalidatePath('/family')
  return { ok: true }
}

export async function deleteMember(memberId: string): Promise<{ error?: string } | null> {
  const { supabase } = await getFamilyId()

  const { data: target } = await supabase
    .from('members')
    .select('role')
    .eq('id', memberId)
    .single()
  if (target?.role === 'admin') return { error: '「自己」的档案是账号根基，不能删除' }

  const { error } = await supabase.from('members').delete().eq('id', memberId)
  if (error) return { error: error.message }

  revalidatePath('/family')
  return null
}
