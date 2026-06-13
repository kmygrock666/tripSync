import { NavLink, Navigate, Route, Routes, useParams, Link } from 'react-router-dom'
import { useTrip, usePendingWrites } from '../../hooks/useTripData'
import { ItineraryTab } from './ItineraryTab'
import { ExpensesTab } from './ExpensesTab'
import { SettlementTab } from './SettlementTab'
import { MoreTab } from './MoreTab'

export function TripLayout() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trip, notFound, error } = useTrip(tripId!)
  const pending = usePendingWrites(tripId!)

  if (notFound) return <div className="center">找不到旅程</div>
  if (error) return <div className="center error-msg">載入失敗：{error}</div>
  if (!trip) return <div className="center" role="status" aria-label="載入中">載入中…</div>

  return (
    <div className="trip-layout">
      <header className="trip-header">
        <Link to="/" className="btn-text">←</Link>
        <h1>{trip.name}</h1>
        <span
          className="sync-dot"
          aria-live="polite"
          aria-label={pending ? '待同步' : '已同步'}
        >
          {pending ? '🔄' : '✅'}
        </span>
      </header>

      <main className="trip-main">
        <Routes>
          <Route path="itinerary" element={<ItineraryTab trip={trip} />} />
          <Route path="expenses" element={<ExpensesTab trip={trip} />} />
          <Route path="settlement" element={<SettlementTab trip={trip} />} />
          <Route path="more" element={<MoreTab trip={trip} />} />
          <Route path="*" element={<Navigate to="itinerary" replace />} />
        </Routes>
      </main>

      <nav className="tab-bar">
        <NavLink to="itinerary">🗓️ 行程</NavLink>
        <NavLink to="expenses">💰 記帳</NavLink>
        <NavLink to="settlement">⚖️ 結算</NavLink>
        <NavLink to="more">⋯ 更多</NavLink>
      </nav>
    </div>
  )
}
