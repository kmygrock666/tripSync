import { useSubcollection } from '../../hooks/useTripData'
import { toTWD } from '../../lib/currency'
import { computeBalances, computeTotals, simplifyDebts } from '../../lib/settlement'
import { CATEGORY_LABEL } from './ExpensesTab'
import type { Expense, ExpenseCategory, Trip } from '../../lib/types'

export function SettlementTab({ trip }: { trip: Trip }) {
  const expenses = useSubcollection<Expense>(trip.id, 'expenses')

  // Filter expenses where exchange rate is not yet configured
  const missing = [
    ...new Set(
      expenses
        .filter((e) => e.currency !== 'TWD' && trip.rates[e.currency] === undefined)
        .map((e) => e.currency),
    ),
  ]
  const valid = expenses.filter(
    (e) => e.currency === 'TWD' || trip.rates[e.currency] !== undefined,
  )

  const totals = computeTotals(valid, trip.rates)
  const balances = computeBalances(valid, trip.rates)
  const transfers = simplifyDebts(balances)
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0)

  const byCategory = new Map<ExpenseCategory, number>()
  for (const e of valid) {
    const twd = toTWD(e.amount, e.currency, trip.rates)
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + twd)
  }

  const name = (uid: string) => trip.members[uid]?.name ?? uid

  return (
    <div className="page">
      {missing.length > 0 && (
        <p className="error card">
          ⚠️ 尚未設定匯率：{missing.join('、')}（到「更多 → 旅程設定」設定後才會計入結算）
        </p>
      )}

      <div className="card">
        <h2 className="section-title">總花費</h2>
        <p className="grand-total">{grandTotal.toLocaleString()} TWD</p>
      </div>

      <div className="card">
        <h2 className="section-title">分類統計</h2>
        {[...byCategory.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([cat, amt]) => (
            <div key={cat} className="bar-row">
              <span className="bar-label">{CATEGORY_LABEL[cat]}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: grandTotal > 0 ? `${(amt / grandTotal) * 100}%` : '0%' }}
                />
              </div>
              <span className="bar-amount">{amt.toLocaleString()}</span>
            </div>
          ))}
        {byCategory.size === 0 && <p className="muted">還沒有帳目。</p>}
      </div>

      <div className="card">
        <h2 className="section-title">每人實付</h2>
        {trip.memberUids.map((uid) => (
          <div key={uid} className="settle-row">
            <span>{name(uid)}</span>
            <span>{(totals[uid] ?? 0).toLocaleString()} TWD</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="section-title">還錢方案（最少轉帳）</h2>
        {transfers.map((t, i) => (
          <div key={i} className="settle-row transfer">
            <span>
              {name(t.from)} → {name(t.to)}
            </span>
            <strong>{t.amount.toLocaleString()} TWD</strong>
          </div>
        ))}
        {transfers.length === 0 && <p className="muted">大家都結清了 🎉</p>}
      </div>
    </div>
  )
}
