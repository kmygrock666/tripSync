// 臨時用：匯入首爾行程資料 ── 用完後刪除此檔案及在 MoreTab 的引用
import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Trip } from '../../lib/types'

const SEOUL_ITINERARY = [
  // ── DAY 1 ── 6/24 (三)
  {
    day: '2026-06-24', time: '21:15', type: 'transport' as const,
    title: '抵達仁川機場，搭 AREX 前往市區',
    note: '真航空 LJ737。仁川機場 → AREX 機場快線 → 市區',
    mapUrl: '', bookingRef: '去程：17:30 台中(TXG) → 21:15 首爾(仁川ICN)　真航空 LJ737',
  },
  {
    day: '2026-06-24', time: '', type: 'lodging' as const,
    title: '飯店 CHECK-IN',
    note: 'HOTEL THE BOTANIK SEWOON MYEONGDONG ★★★★　辦理入住、休息',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-24', time: '', type: 'food' as const,
    title: '宵夜 TIME — 明洞',
    note: '超商 / 豬肉湯飯 / 馬鈴薯排骨湯 / 雪濃湯',
    mapUrl: '', bookingRef: '',
  },

  // ── DAY 2 ── 6/25 (四) 安國・景福宮・聖水洞
  {
    day: '2026-06-25', time: '07:30', type: 'food' as const,
    title: 'London Bagel Museum',
    note: '7:30–8:00 抵達，安國站',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-25', time: '08:30', type: 'sight' as const,
    title: 'Artist Bakery Anguk + 安國站逛街',
    note: '',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-25', time: '12:00', type: 'food' as const,
    title: '土俗村蔘雞湯',
    note: '午餐，景福宮附近',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-25', time: '14:00', type: 'sight' as const,
    title: '聖水洞下午行程',
    note: '陸洞水芹菜聖水店・烤鴨(DOSA)・聖水洞逛街・鹽麵包 / Gelato',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-25', time: '19:00', type: 'sight' as const,
    title: '明洞逛街',
    note: '購物・美食・藥妝',
    mapUrl: '', bookingRef: '',
  },

  // ── DAY 3 ── 6/26 (五) 弘大・望遠市場・明洞
  {
    day: '2026-06-26', time: '09:00', type: 'sight' as const,
    title: 'PPEUM 弘大國際店（醫美）',
    note: '已預約',
    mapUrl: '', bookingRef: '已預約',
  },
  {
    day: '2026-06-26', time: '12:00', type: 'food' as const,
    title: '花蟹世界 弘大店',
    note: '午餐',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-26', time: '14:00', type: 'sight' as const,
    title: '弘大逛街',
    note: '男生版 Olive Young・弘大藥局買麗珠蘭',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-26', time: '17:00', type: 'sight' as const,
    title: '望遠市場',
    note: '傍晚逛市場',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-26', time: '19:00', type: 'food' as const,
    title: '荒謬的生肉 弘大店',
    note: '晚餐',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-26', time: '21:00', type: 'sight' as const,
    title: '明洞夜間行程',
    note: '明洞補貨・明洞換匯・起司年糕・炒冬粉',
    mapUrl: '', bookingRef: '',
  },

  // ── DAY 4 ── 6/27 (六) 飯店退房・回台灣
  {
    day: '2026-06-27', time: '10:30', type: 'transport' as const,
    title: '飯店退房，前往仁川機場',
    note: '整理行李後退房，搭普通 AREX 前往仁川機場',
    mapUrl: '', bookingRef: '',
  },
  {
    day: '2026-06-27', time: '14:50', type: 'transport' as const,
    title: '回程班機起飛',
    note: '首爾(仁川ICN) → 16:30 台中(TXG)',
    mapUrl: '', bookingRef: '回程：14:50 首爾(仁川ICN) → 16:30 台中(TXG)　真航空 LJ737',
  },
]

export function SeoulSeedButton({ trip }: { trip: Trip }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)

  async function handleImport() {
    if (!confirm(`確定要將首爾行程（16 筆）匯入「${trip.name}」嗎？`)) return
    setStatus('loading')
    setProgress(0)
    try {
      const colRef = collection(db, 'trips', trip.id, 'itinerary')
      for (let i = 0; i < SEOUL_ITINERARY.length; i++) {
        await addDoc(colRef, SEOUL_ITINERARY[i])
        setProgress(i + 1)
      }
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className="card" style={{ border: '2px dashed #1a73e8' }}>
      <h2 className="section-title">🌏 匯入首爾行程資料（一次性）</h2>
      {status === 'idle' && (
        <button className="btn-primary full" onClick={handleImport}>
          匯入 16 筆首爾行程
        </button>
      )}
      {status === 'loading' && (
        <p className="muted">匯入中… {progress} / {SEOUL_ITINERARY.length}</p>
      )}
      {status === 'done' && (
        <p style={{ color: 'green' }}>✅ 匯入完成！請到「行程」分頁確認，然後通知開發者刪除此按鈕。</p>
      )}
      {status === 'error' && (
        <p className="error">匯入失敗，請確認 Firestore 規則是否已發布並重試。</p>
      )}
    </div>
  )
}
