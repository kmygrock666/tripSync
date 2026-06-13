import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { TripListPage } from './pages/TripListPage'
import { TripLayout } from './pages/trip/TripLayout'

export default function App() {
  const { user, loading, signIn } = useAuth()

  if (loading) return <div className="center" role="status" aria-label="載入中">載入中…</div>
  if (!user) return <LoginPage signIn={signIn} />

  return (
    <Routes>
      <Route path="/" element={<TripListPage />} />
      <Route path="/trip/:tripId/*" element={<TripLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
