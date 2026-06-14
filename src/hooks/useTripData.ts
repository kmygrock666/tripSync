import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Trip } from '../lib/types'

/** 訂閱 trip 主文件 */
export function useTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTrip(null)
    setNotFound(false)
    setError(null)
    return onSnapshot(
      doc(db, 'trips', tripId),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true)
          return
        }
        setTrip({ ...(snap.data() as Omit<Trip, 'id'>), id: snap.id })
      },
      (err) => setError(err.message),
    )
  }, [tripId])

  return { trip, notFound, error }
}

/** 訂閱 trip 子集合（itinerary / expenses / checklist） */
export function useSubcollection<T extends { id: string }>(tripId: string, name: string): T[] {
  const [items, setItems] = useState<T[]>([])

  useEffect(() => {
    setItems([])
    return onSnapshot(
      collection(db, 'trips', tripId, name),
      (snap) => {
        setItems(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T))
      },
      (err) => console.error(`useSubcollection(${name}):`, err),
    )
  }, [tripId, name])

  return items
}

/** 是否有等待上傳的本地寫入（同步狀態圖示用） */
export function usePendingWrites(tripId: string): boolean {
  const [pending, setPending] = useState(false)

  useEffect(() => {
    return onSnapshot(
      doc(db, 'trips', tripId),
      { includeMetadataChanges: true },
      (snap) => setPending(snap.metadata.hasPendingWrites),
      (err) => console.error('usePendingWrites:', err),
    )
  }, [tripId])

  return pending
}
