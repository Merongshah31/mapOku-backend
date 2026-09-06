import { useState } from 'react'
import { login, register } from '../api/auth.js'

function AuthGate({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      if (mode === 'register') {
        await register(email.trim(), password, username.trim())
        setInfo('Account created. You can sign in now — confirm email in Supabase if prompted.')
        setMode('login')
      } else {
        await login(email.trim(), password)
        onAuthenticated?.()
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  const fieldClass =
    'touch-target w-full rounded-xl border-0 bg-[#F2F0E9] px-4 py-3.5 text-base text-[#1E2B22] outline-none ring-1 ring-[#1E2B22]/8 transition placeholder:text-[#1E2B22]/35 focus:bg-white focus:ring-2 focus:ring-[#346F4B]/35 sm:text-sm'

  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-md flex-col gap-5 px-1 py-1 sm:gap-6 sm:py-2">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#346F4B] sm:text-xs">
          mapOku rewards
        </p>
        <h1 className="font-display mt-2 text-[1.75rem] font-bold tracking-tight text-[#1E2B22] sm:text-3xl">
          {mode === 'login' ? 'Welcome back' : 'Join mapOku'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#1E2B22]/55">
          {mode === 'login'
            ? 'Sign in to see your points and redeem transit credit.'
            : 'Create an account to view your points and redeem rewards.'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="flex flex-col gap-3">
        {mode === 'register' && (
          <input
            type="text"
            required
            autoComplete="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={fieldClass}
          />
        )}
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClass}
        />

        {error && (
          <p className="break-words rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        )}
        {info && (
          <p className="break-words rounded-xl bg-[#E7EFE9] px-3 py-2 text-sm text-[#2A593C] ring-1 ring-[#346F4B]/15">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 min-h-12 w-full rounded-xl bg-[#346F4B] py-3.5 text-sm font-bold text-white transition hover:bg-[#2A593C] disabled:opacity-60"
        >
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        className="min-h-11 text-sm font-medium text-[#1E2B22]/55 transition hover:text-[#346F4B]"
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          setError('')
          setInfo('')
        }}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}

export default AuthGate
