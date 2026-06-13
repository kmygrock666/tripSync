import { useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useSubcollection } from '../../hooks/useTripData'
import type { ChecklistItem, Trip } from '../../lib/types'

export function MoreTab({ trip }: { trip: Trip }) {
  return (
    <div className="page">
      <Checklist trip={trip} />
      <RatesSettings trip={trip} />
      <TripInfo trip={trip} />
    </div>
  )
}

function Checklist({ trip }: { trip: Trip }) {
  const items = useSubcollection<ChecklistItem>(trip.id, 'checklist')
  const [text, setText] = useState('')

  async function handleAdd() {
    const t = text.trim()
    if (!t) return
    try {
      await addDoc(collection(db, 'trips', trip.id, 'checklist'), {
        text: t,
        done: false,
        assignee: '',
      })
      setText('')
    } catch (err) {
      console.error('Failed to add checklist item:', err)
      alert('新增失敗，請稍後再試')
    }
  }

  async function handleToggle(item: ChecklistItem) {
    try {
      await updateDoc(doc(db, 'trips', trip.id, 'checklist', item.id), {
        done: !item.done,
      })
    } catch (err) {
      console.error('Failed to toggle checklist item:', err)
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('刪除這個項目？')) return
    try {
      await deleteDoc(doc(db, 'trips', trip.id, 'checklist', id))
    } catch (err) {
      console.error('Failed to delete checklist item:', err)
    }
  }

  return (
    <div className="card">
      <h2 className="section-title">行前清單</h2>
      {items
        .slice()
        .sort((a, b) => Number(a.done) - Number(b.done))
        .map((it) => (
          <div key={it.id} className="check-row">
            <label className="check-label">
              <input
                type="checkbox"
                checked={it.done}
                onChange={() => handleToggle(it)}
              />
              <span className={it.done ? 'done' : ''}>{it.text}</span>
            </label>
            <button
              className="btn-text"
              aria-label={`刪除：${it.text}`}
              onClick={() => handleDeleteItem(it.id)}
            >
              ✕
            </button>
          </div>
        ))}
      <div className="row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例：換日幣、辦網卡"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          maxLength={200}
        />
        <button className="btn-primary" onClick={handleAdd}>
          加入
        </button>
      </div>
    </div>
  )
}

function RatesSettings({ trip }: { trip: Trip }) {
  const [code, setCode] = useState('')
  const [rate, setRate] = useState('')
  const [msg, setMsg] = useState('')

  async function handleAdd() {
    const c = code.trim().toUpperCase()
    const r = Number(rate)
    if (!/^[A-Z]{3}$/.test(c)) {
      setMsg('請輸入 3 碼幣別代碼（例：JPY）')
      return
    }
    if (!(r > 0)) {
      setMsg('匯率必須大於 0')
      return
    }
    try {
      await updateDoc(doc(db, 'trips', trip.id), { [`rates.${c}`]: r })
      setCode('')
      setRate('')
      setMsg('')
    } catch (err) {
      console.error('Failed to add rate:', err)
      setMsg('儲存失敗，請稍後再試')
    }
  }

  async function handleFetch(c: string) {
    setMsg('抓取中…')
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/TWD')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { rates?: Record<string, number> }
      const perTwd = data.rates?.[c]
      if (!perTwd) throw new Error(`API 未回傳 ${c}`)
      const r = Number((1 / perTwd).toFixed(4))
      await updateDoc(doc(db, 'trips', trip.id), { [`rates.${c}`]: r })
      setMsg(`已更新 ${c}：1 ${c} = ${r} TWD`)
    } catch {
      setMsg('抓取失敗（可能離線），請手動輸入匯率')
    }
  }

  async function handleRemove(c: string) {
    if (!confirm(`移除 ${c} 匯率？`)) return
    try {
      await updateDoc(doc(db, 'trips', trip.id), { [`rates.${c}`]: deleteField() })
    } catch (err) {
      console.error('Failed to remove rate:', err)
    }
  }

  return (
    <div className="card">
      <h2 className="section-title">匯率設定（1 外幣 = ? TWD）</h2>
      {Object.entries(trip.rates).map(([c, r]) => (
        <div key={c} className="settle-row">
          <span>
            1 {c} = {r} TWD
          </span>
          <span className="row" style={{ marginTop: 0, gap: 8 }}>
            <button className="btn-text" onClick={() => handleFetch(c)}>
              ↻ 更新
            </button>
            <button className="btn-text" aria-label={`移除 ${c}`} onClick={() => handleRemove(c)}>
              ✕
            </button>
          </span>
        </div>
      ))}
      <div className="row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="JPY"
          maxLength={3}
          style={{ width: 80 }}
        />
        <input
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          type="number"
          inputMode="decimal"
          step="any"
          min="0.0001"
          placeholder="0.22"
        />
        <button className="btn-primary" onClick={handleAdd}>
          新增
        </button>
      </div>
      {msg && <p className="muted" style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  )
}

function TripInfo({ trip }: { trip: Trip }) {
  return (
    <div className="card">
      <h2 className="section-title">旅程資訊</h2>
      <div className="settle-row">
        <span>邀請碼</span>
        <strong className="invite-code">{trip.inviteCode}</strong>
      </div>
      <div className="settle-row">
        <span>成員</span>
        <span>
          {trip.memberUids.map((uid) => trip.members[uid]?.name ?? uid).join('、')}
        </span>
      </div>
      <div className="settle-row">
        <span>日期</span>
        <span>
          {trip.startDate} ~ {trip.endDate}
        </span>
      </div>
    </div>
  )
}
