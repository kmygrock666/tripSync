import type { Trip } from '../../lib/types'
export function MoreTab({ trip }: { trip: Trip }) {
  return <div className="page">更多（Task 12 實作）— {trip.name}</div>
}
