import { useState } from 'react'

interface Props {
  signIn: () => Promise<unknown>
}

export function LoginPage({ signIn }: Props) {
  const [error, setError] = useState('')

  async function handleSignIn() {
    setError('')
    try {
      await signIn()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        return // user dismissed the popup — not an error
      }
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
