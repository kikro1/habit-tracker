import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { NotebookPen, Sprout } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    const { error } =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password)

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    if (mode === 'signup') {
      setInfo('Account created. Check your inbox to confirm your email, then sign in.')
      setMode('signin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-full bg-moss text-paper flex items-center justify-center mb-3 shadow-card">
            <Sprout size={22} strokeWidth={2} />
          </div>
          <h1 className="font-display text-3xl text-ink">Field Log</h1>
          <p className="text-ink-faint text-sm mt-1">A quiet ledger for daily habits.</p>
        </div>

        <div className="bg-paper-dim border border-line rounded-card shadow-card p-6">
          <div className="flex mb-6 rounded-full bg-paper-deep p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-full py-1.5 transition-colors cursor-pointer ${
                mode === 'signin' ? 'bg-moss text-paper shadow-card' : 'text-ink-soft'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-full py-1.5 transition-colors cursor-pointer ${
                mode === 'signup' ? 'bg-moss text-paper shadow-card' : 'text-ink-soft'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-moss focus:ring-1 focus:ring-moss"
                placeholder="you@example.com"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft font-medium">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-moss focus:ring-1 focus:ring-moss"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="text-sm text-terracotta bg-terracotta-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-moss-dark bg-moss-50 rounded-lg px-3 py-2">{info}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-moss text-paper font-medium py-2.5 shadow-card hover:bg-moss-dark transition-colors disabled:opacity-60 cursor-pointer"
            >
              <NotebookPen size={16} />
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
