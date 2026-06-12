export interface Member {
  name: string
  photo: string
  joinedAt: number
}

export interface Trip {
  id: string
  name: string
  destination: string
  startDate: string // YYYY-MM-DD
  endDate: string
  inviteCode: string
  members: Record<string, Member> // key: uid
  memberUids: string[] // 供 array-contains 查詢
  baseCurrency: 'TWD'
  rates: Record<string, number> // 1 外幣 = rates[code] TWD
  createdBy: string
}

export type ItineraryType = 'sight' | 'transport' | 'lodging' | 'food'

export interface ItineraryItem {
  id: string
  day: string // YYYY-MM-DD
  time: string // HH:mm，可空字串
  type: ItineraryType
  title: string
  note: string
  mapUrl: string
  bookingRef: string
}

export type ExpenseCategory =
  | 'food' | 'transport' | 'lodging' | 'shopping' | 'ticket' | 'other'

export interface Expense {
  id: string
  date: string // YYYY-MM-DD
  category: ExpenseCategory
  amount: number
  currency: string // 'TWD' | 'JPY' | ...
  paidBy: string // uid
  splitWith: string[] // uid[]，至少一人
  note: string
  createdAt: number
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
  assignee: string // uid 或空字串
}
