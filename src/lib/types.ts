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
