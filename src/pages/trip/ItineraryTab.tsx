import type { Trip } from '../../lib/types'
export function ItineraryTab({ trip }: { trip: Trip }) {
  return <div className="page">行程（Task 9 實作）— {trip.name}</div>
}
