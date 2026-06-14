import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useSubcollection } from '../../hooks/useTripData'
import type { ItineraryItem, ItineraryType, Trip } from '../../lib/types'

const TYPE_LABEL: Record<ItineraryType, string> = {
  sight: '📍 景點', transport: '🚄 交通', lodging: '🏨 住宿', food: '🍜 餐廳',
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ItineraryTab({ trip }: { trip: Trip }) {
  const items = useSubcollection<ItineraryItem>(trip.id, 'itinerary')
  const [editing, setEditing] = useState<ItineraryItem | 'new' | null>(null)

  const byDay = new Map<string, ItineraryItem[]>()
  for (const it of items) {
    if (!byDay.has(it.day)) byDay.set(it.day, [])
    byDay.get(it.day)!.push(it)
  }
  const days = [...byDay.keys()].sort()
  const today = todayStr()
  const ordered = days.includes(today)
    ? [today, ...days.filter((d) => d !== today)]
    : days

  async function handleSave(formData: FormData) {
    const data = {
      day: formData.get('day') as string,
      time: formData.get('time') as string,
      type: formData.get('type') as ItineraryType,
      title: (formData.get('title') as string).trim(),
      note: ((formData.get('note') as string | null) ?? '').trim(),
      mapUrl: ((formData.get('mapUrl') as string | null) ?? '').trim(),
      bookingRef: ((formData.get('bookingRef') as string | null) ?? '').trim(),
    }
    if (!data.title || !data.day) return
    try {
      if (editing === 'new') {
        await addDoc(collection(db, 'trips', trip.id, 'itinerary'), data)
      } else if (editing) {
        await updateDoc(doc(db, 'trips', trip.id, 'itinerary', editing.id), data)
      }
      setEditing(null)
    } catch (err) {
      console.error('Failed to save itinerary item:', err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('確定刪除這個行程項目？')) return
    try {
      await deleteDoc(doc(db, 'trips', trip.id, 'itinerary', id))
      setEditing(null)
    } catch (err) {
      console.error('Failed to delete itinerary item:', err)
    }
  }

  const defaultDay =
    today >= trip.startDate && today <= trip.endDate ? today : trip.startDate

  return (
    <div className="page">
      <button className="btn-primary full" onClick={() => setEditing('new')}>
        ＋ 新增行程
      </button>

      {editing && (
        <form className="card" action={handleSave}>
          <label>日期</label>
          <input
            name="day"
            type="date"
            required
            defaultValue={editing === 'new' ? defaultDay : editing.day}
          />
          <label>時間（可空白）</label>
          <input
            name="time"
            type="time"
            defaultValue={editing === 'new' ? '' : editing.time}
          />
          <label>類型</label>
          <select name="type" defaultValue={editing === 'new' ? 'sight' : editing.type}>
            <option value="sight">景點</option>
            <option value="transport">交通</option>
            <option value="lodging">住宿</option>
            <option value="food">餐廳</option>
          </select>
          <label>標題</label>
          <input
            name="title"
            required
            placeholder="例：淺草寺"
            defaultValue={editing === 'new' ? '' : editing.title}
          />
          <label>備註</label>
          <textarea
            name="note"
            rows={2}
            placeholder="例：御守要在五點前買"
            defaultValue={editing === 'new' ? '' : editing.note}
          />
          <label>Google Maps 連結（可空白）</label>
          <input
            name="mapUrl"
            type="url"
            placeholder="https://maps.app.goo.gl/..."
            defaultValue={editing === 'new' ? '' : editing.mapUrl}
          />
          <label>訂單資訊（航班/訂房編號，可空白）</label>
          <input
            name="bookingRef"
            placeholder="例：BR198 / 訂房 #12345"
            defaultValue={editing === 'new' ? '' : editing.bookingRef}
          />
          <div className="row">
            <button type="submit" className="btn-primary">儲存</button>
            <button type="button" className="btn-text" onClick={() => setEditing(null)}>
              取消
            </button>
            {editing !== 'new' && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleDelete((editing as ItineraryItem).id)}
              >
                刪除
              </button>
            )}
          </div>
        </form>
      )}

      {ordered.map((day) => (
        <section key={day}>
          <h2 className="day-heading">
            {day} {day === today && <span className="badge">今天</span>}
          </h2>
          {byDay
            .get(day)!
            .slice()
            .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
            .map((it) => (
              <div
                key={it.id}
                className="card itinerary-item"
                onClick={() => setEditing(it)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setEditing(it)
                  }
                }}
                aria-label={`編輯：${it.title}`}
              >
                <div className="item-head">
                  <span className="item-time">{it.time || '—'}</span>
                  <span>{TYPE_LABEL[it.type]}</span>
                  <strong>{it.title}</strong>
                </div>
                {it.note && <p className="muted">{it.note}</p>}
                {it.bookingRef && <p className="muted">📎 {it.bookingRef}</p>}
                {it.mapUrl && (
                  <a
                    href={/^https?:\/\//.test(it.mapUrl) ? it.mapUrl : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-text"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🗺️ 開啟地圖
                  </a>
                )}
              </div>
            ))}
        </section>
      ))}
      {items.length === 0 && !editing && (
        <p className="muted" style={{ marginTop: 16 }}>
          還沒有行程，按上方按鈕新增。
        </p>
      )}
    </div>
  )
}
