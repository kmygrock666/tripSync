import type { Expense } from './types'
import { toTWD } from './currency'

export interface Transfer {
  from: string
  to: string
  amount: number
}

/** 每人實付總額（TWD） */
export function computeTotals(
  expenses: Expense[],
  rates: Record<string, number>,
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const e of expenses) {
    totals[e.paidBy] = (totals[e.paidBy] ?? 0) + toTWD(e.amount, e.currency, rates)
  }
  return totals
}

/** 每人淨額（正＝別人欠他，負＝他欠別人），總和保證為 0 */
export function computeBalances(
  expenses: Expense[],
  rates: Record<string, number>,
): Record<string, number> {
  const bal: Record<string, number> = {}
  for (const e of expenses) {
    const twd = toTWD(e.amount, e.currency, rates)
    const share = Math.round(twd / e.splitWith.length)
    let assigned = 0
    for (const uid of e.splitWith) {
      bal[uid] = (bal[uid] ?? 0) - share
      assigned += share
    }
    // 付款人收回「實際被分掉的總額」，四捨五入差額自然由付款人吸收
    bal[e.paidBy] = (bal[e.paidBy] ?? 0) + assigned
  }
  return bal
}

/** 貪婪法（降冪配對）：適用 2-4 人，近似最小化轉帳次數 */
export function simplifyDebts(balances: Record<string, number>): Transfer[] {
  const sum = Object.values(balances).reduce((s, v) => s + v, 0)
  if (sum !== 0) throw new Error(`simplifyDebts: balances do not sum to 0 (got ${sum})`)
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0).map(([k, v]) => ({ uid: k, amt: v }))
    .sort((x, y) => y.amt - x.amt)
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < 0).map(([k, v]) => ({ uid: k, amt: -v }))
    .sort((x, y) => y.amt - x.amt)

  const transfers: Transfer[] = []
  let i = 0, j = 0
  while (i < creditors.length && j < debtors.length) {
    const pay = Math.min(creditors[i].amt, debtors[j].amt)
    transfers.push({ from: debtors[j].uid, to: creditors[i].uid, amount: pay })
    creditors[i].amt -= pay
    debtors[j].amt -= pay
    if (creditors[i].amt === 0) i++
    if (debtors[j].amt === 0) j++
  }
  return transfers
}
