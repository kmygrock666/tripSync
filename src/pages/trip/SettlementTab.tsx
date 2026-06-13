import type { Trip } from '../../lib/types'
export function SettlementTab({ trip }: { trip: Trip }) {
  return <div className="page">結算（Task 11 實作）— {trip.name}</div>
}
