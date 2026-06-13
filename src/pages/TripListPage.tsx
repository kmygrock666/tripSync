import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection, doc, getDoc, onSnapshot, query, runTransaction, where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { generateInviteCode } from '../lib/inviteCode'
import type { Trip } from '../lib/types'

export function TripListPage() {
  const { user, signOut } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'trips'),
      where('memberUids', 'array-contains', user.uid),
    )
    return onSnapshot(q, (snap) => {
      setTrips(snap.docs.map((d) => ({ ...(d.data() as Omit<Trip, 'id'>), id: d.id })))
    })
  }, [user])

  async function handleCreate(formData: FormData) {
    if (!user) return
    const name = (formData.get('name') as string).trim()
    if (!name) return
    const code = generateInviteCode()
    const tripRef = doc(collection(db, 'trips'))
    const codeRef = doc(db, 'inviteCodes', code)
    await runTransaction(db, async (tx) => {
      tx.set(tripRef, {
        name,
        destination: (formData.get('destination') as string).trim(),
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        inviteCode: code,
        members: {
          [user.uid]: {
            name: user.displayName ?? '旅伴',
            photo: user.photoURL ?? '',
            joinedAt: Date.now(),
          },
        },
        memberUids: [user.uid],
        baseCurrency: 'TWD',
        rates: {},
        createdBy: user.uid,
      })
      tx.set(codeRef, { tripId: tripRef.id })
    })
    setShowCreate(false)
  }

  async function handleJoin() {
    if (!user) return
    setError('')
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('邀請碼為 6 碼')
      return
    }
    try {
      const codeSnap = await getDoc(doc(db, 'inviteCodes', code))
      if (!codeSnap.exists()) {
        setError('邀請碼無效')
        return
      }
      const tripId = codeSnap.data().tripId as string
      await runTransaction(db, async (tx) => {
        const tripRef = doc(db, 'trips', tripId)
        const tripSnap = await tx.get(tripRef)
        if (!tripSnap.exists()) throw new Error('旅程不存在')
        const data = tripSnap.data() as Trip
        if (data.memberUids.includes(user.uid)) return
        tx.update(tripRef, {
          [`members.${user.uid}`]: {
            name: user.displayName ?? '旅伴',
            photo: user.photoURL ?? '',
            joinedAt: Date.now(),
          },
          memberUids: [...data.memberUids, user.uid],
        })
      })
      setJoinCode('')
    } catch {
      setError('加入失敗，請確認網路後再試')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>我的旅程</h1>
        <button className="btn-text" onClick={signOut}>登出</button>
      </header>

      {trips.map((t) => (
        <Link key={t.id} to={`/trip/${t.id}/itinerary`} className="card trip-card">
          <strong>{t.name}</strong>
          <span className="muted">
            {t.destination}・{t.startDate} ~ {t.endDate}
          </span>
        </Link>
      ))}
      {trips.length === 0 && <p className="muted">還沒有旅程，建立一個吧！</p>}

      <div className="card">
        {showCreate ? (
          <form action={handleCreate}>
            <label>旅程名稱</label>
            <input name="name" required placeholder="例：東京五日遊" />
            <label>目的地</label>
            <input name="destination" placeholder="例：東京" />
            <label>開始日期</label>
            <input name="startDate" type="date" required />
            <label>結束日期</label>
            <input name="endDate" type="date" required />
            <div className="row">
              <button type="submit" className="btn-primary">建立</button>
              <button type="button" className="btn-text" onClick={() => setShowCreate(false)}>
                取消
              </button>
            </div>
          </form>
        ) : (
          <button className="btn-primary full" onClick={() => setShowCreate(true)}>
            ＋ 建立旅程
          </button>
        )}
      </div>

      <div className="card">
        <label>用邀請碼加入</label>
        <div className="row">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="6 碼邀請碼"
            maxLength={6}
          />
          <button className="btn-primary" onClick={handleJoin}>加入</button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
