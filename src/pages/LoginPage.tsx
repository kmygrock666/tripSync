import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { signIn } = useAuth()
  const [error, setError] = useState('')

  async function handleSignIn() {
    setError('')
    try {
      await signIn()
    } catch {
      setError('登入失敗，請再試一次')
    }
  }

  return (
    <div className="login-page">
      <h1>TripSync</h1>
      <p>旅遊行程安排・分帳記帳</p>
      <button className="btn-primary" onClick={handleSignIn}>
        使用 Google 登入
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
