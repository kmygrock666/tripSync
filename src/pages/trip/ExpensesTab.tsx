import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useSubcollection } from '../../hooks/useTripData'
import { toTWD } from '../../lib/currency'
import type { Expense, ExpenseCategory, Trip } from '../../lib/types'

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: '🍜 餐飲', transport: '🚄 交通', lodging: '🏨 住宿',
  shopping: '🛍️ 購物', ticket: '🎫 門票', other: '📦 其他',
}

export function ExpensesTab({ trip }: { trip: Trip }) {
  const expenses = useSubcollection<Expense>(trip.id, 'expenses')
  const [editing, setEditing] = useState<Expense | 'new' | null>(null)
  const currencies = ['TWD', ...Object.keys(trip.rates)]
  const uids = trip.memberUids

  async function handleSave(formData: FormData) {
    const splitWith = uids.filter((uid) => formData.get(`split-${uid}`) === 'on')
    if (splitWith.length === 0) {
      alert('至少要分給一個人')
      return
    }
    const amountRaw = formData.get('amount') as string | null
    const amount = Number(amountRaw ?? '0')
    if (!amount || amount <= 0) {
      alert('請輸入有效金額')
      return
    }
    const data = {
      date: ((formData.get('date') as string | null) ?? ''),
      category: ((formData.get('category') as string | null) ?? 'other') as ExpenseCategory,
      amount,
      currency: ((formData.get('currency') as string | null) ?? 'TWD'),
      paidBy: ((formData.get('paidBy') as string | null) ?? ''),
      splitWith,
      note: ((formData.get('note') as string | null) ?? '').trim(),
      createdAt: editing === 'new' ? Date.now() : (editing as Expense).createdAt,
    }
    try {
      if (editing === 'new') {
        await addDoc(collection(db, 'trips', trip.id, 'expenses'), data)
      } else if (editing) {
        await updateDoc(doc(db, 'trips', trip.id, 'expenses', editing.id), data)
      }
      setEditing(null)
    } catch (err) {
      console.error('Failed to save expense:', err)
      alert('儲存失敗，請稍後再試')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('確定刪除這筆帳？')) return
    try {
      await deleteDoc(doc(db, 'trips', trip.id, 'expenses', id))
      setEditing(null)
    } catch (err) {
      console.error('Failed to delete expense:', err)
      alert('刪除失敗，請稍後再試')
    }
  }

  const byDate = new Map<string, Expense[]>()
  for (const e of expenses) {
    if (!byDate.has(e.date)) byDate.set(e.date, [])
    byDate.get(e.date)!.push(e)
  }
  const dates = [...byDate.keys()].sort().reverse()

  return (
    <div className="page">
      <button className="btn-primary full" onClick={() => setEditing('new')}>
        ＋ 記一筆
      </button>

      {editing && (
        <form className="card" action={handleSave}>
          <label>日期</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={
              editing === 'new'
                ? new Date().toISOString().slice(0, 10)
                : editing.date
            }
          />
          <label>金額</label>
          <div className="row" style={{ marginTop: 0 }}>
            <input
              name="amount"
              type="number"
              inputMode="decimal"
              step="any"
              min="0.01"
              required
              placeholder="0"
              defaultValue={editing === 'new' ? '' : editing.amount}
            />
            <select
              name="currency"
              style={{ width: 100 }}
              defaultValue={
                editing === 'new'
                  ? currencies[currencies.length - 1]
                  : editing.currency
              }
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <label>分類</label>
          <select
            name="category"
            defaultValue={editing === 'new' ? 'food' : editing.category}
          >
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <label>誰付的</label>
          <select
            name="paidBy"
            defaultValue={editing === 'new' ? uids[0] : editing.paidBy}
          >
            {uids.map((uid) => (
              <option key={uid} value={uid}>
                {trip.members[uid]?.name ?? uid}
              </option>
            ))}
          </select>
          <label>分給誰（預設全員均分）</label>
          <div className="split-checks">
            {uids.map((uid) => (
              <label key={uid} className="check-label">
                <input
                  type="checkbox"
                  name={`split-${uid}`}
                  defaultChecked={
                    editing === 'new' ? true : editing.splitWith.includes(uid)
                  }
                />
                {trip.members[uid]?.name ?? uid}
              </label>
            ))}
          </div>
          <label>備註（可空白）</label>
          <input
            name="note"
            placeholder="例：一蘭拉麵"
            defaultValue={editing === 'new' ? '' : editing.note}
          />
          <div className="row">
            <button type="submit" className="btn-primary">
              儲存
            </button>
            <button
              type="button"
              className="btn-text"
              onClick={() => setEditing(null)}
            >
              取消
            </button>
            {editing !== 'new' && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleDelete((editing as Expense).id)}
              >
                刪除
              </button>
            )}
          </div>
        </form>
      )}

      {dates.map((date) => (
        <section key={date}>
          <h2 className="day-heading">{date}</h2>
          {byDate
            .get(date)!
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((e) => (
              <div
                key={e.id}
                className="card expense-item"
                onClick={() => setEditing(e)}
                role="button"
                tabIndex={0}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    setEditing(e)
                  }
                }}
                aria-label={`編輯：${e.note || CATEGORY_LABEL[e.category]}`}
              >
                <div className="item-head">
                  <span>{CATEGORY_LABEL[e.category]}</span>
                  {e.note && <span className="muted">{e.note}</span>}
                  <strong className="expense-amount">
                    {e.amount.toLocaleString()} {e.currency}
                  </strong>
                </div>
                <p className="muted">
                  {trip.members[e.paidBy]?.name ?? '?'} 付
                  {e.currency !== 'TWD' &&
                    trip.rates[e.currency] !== undefined &&
                    ` ・ ≈ ${toTWD(e.amount, e.currency, trip.rates).toLocaleString()} TWD`}
                  {' ・ 分 '}
                  {e.splitWith.length} 人
                </p>
              </div>
            ))}
        </section>
      ))}
      {expenses.length === 0 && !editing && (
        <p className="muted" style={{ marginTop: 16 }}>
          還沒有帳目。
        </p>
      )}
    </div>
  )
}
