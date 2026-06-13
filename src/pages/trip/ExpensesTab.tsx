import type { Trip } from '../../lib/types'
export function ExpensesTab({ trip }: { trip: Trip }) {
  return <div className="page">記帳（Task 10 實作）— {trip.name}</div>
}
