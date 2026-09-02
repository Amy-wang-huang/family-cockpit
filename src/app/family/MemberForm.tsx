'use client'

import { useActionState, useEffect, useRef } from 'react'
import { saveMember } from './actions'
import type { Member } from '@/lib/types'

const RELATIONS = [
  '自己', '配偶', '儿子', '女儿', '父亲', '母亲',
  '公公', '婆婆', '岳父', '岳母', '爷爷', '奶奶', '外公', '外婆', '其他亲人',
]
const CONSTITUTIONS = [
  '平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质',
  '湿热质', '血瘀质', '气郁质', '特禀质',
]

interface Props {
  member?: Member
  onDone?: () => void
}

export default function MemberForm({ member, onDone }: Props) {
  const isEdit = !!member
  const [state, formAction, pending] = useActionState(saveMember, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) {
      if (isEdit) onDone?.()
      else formRef.current?.reset()
    }
  }, [state, isEdit, onDone])

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 text-sm'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {member && <input type="hidden" name="memberId" value={member.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>姓名 *</label>
          <input name="name" required defaultValue={member?.name ?? ''} placeholder="如：王芳" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>关系</label>
          <select name="relation" defaultValue={member?.relation ?? ''} className={inputCls}>
            <option value="">不填</option>
            {RELATIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>身份</label>
          <select name="role" defaultValue={member?.role ?? 'member'} className={inputCls}>
            <option value="member">大人</option>
            <option value="child">孩子</option>
            <option value="pet">宠物</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>性别</label>
          <select name="gender" defaultValue={member?.gender ?? ''} className={inputCls}>
            <option value="">不填</option>
            <option value="female">女</option>
            <option value="male">男</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>生日</label>
          <input type="date" name="birthday" defaultValue={member?.birthday ?? ''} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>体质</label>
          <select name="constitution" defaultValue={member?.constitution ?? ''} className={inputCls}>
            <option value="">不填</option>
            {CONSTITUTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>电话</label>
          <input name="phone" defaultValue={member?.phone ?? ''} placeholder="选填" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>标签（逗号分隔）</label>
          <input name="tags" defaultValue={member?.tags?.join('，') ?? ''} placeholder="如：高血压，过敏体质" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>禁忌（逗号分隔）</label>
        <input name="taboos" defaultValue={member?.taboos?.join('，') ?? ''} placeholder="如：海鲜，芒果，花粉" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>备注</label>
        <textarea name="note" defaultValue={member?.note ?? ''} rows={2} placeholder="选填" className={inputCls} />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2.5">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {pending ? '保存中…' : isEdit ? '保存修改' : '添加成员'}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onDone}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}
