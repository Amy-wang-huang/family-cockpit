export interface Member {
  id: string
  name: string
  role: string
  relation: string | null
  gender: string | null
  birthday: string | null
  constitution: string | null
  phone: string | null
  tags: string[] | null
  taboos: string[] | null
  note: string | null
}

export interface FamilyEvent {
  id: string
  member_id: string | null
  type: string
  title: string
  start_date: string
  recurrence: string
  advance_days: number
  is_active: boolean
  note: string | null
}
