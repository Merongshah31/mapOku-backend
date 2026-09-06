import { useCallback, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Rewards from './components/Rewards.jsx'
import AuthGate from './components/AuthGate.jsx'
import { getAccessToken } from './api/client.js'
import { logout } from './api/auth.js'
import { fetchRewards } from './api/rewards.js'

function App() {
  const [token, setToken] = useState(() => getAccessToken())
  const [points, setPoints] = useState(null)

  const refreshPoints = useCallback(async () => {
    if (!getAccessToken()) {
      setPoints(null)
      return
    }
    try {
      const data = await fetchRewards()
      setPoints(data.points)
    } catch {
      // keep prior badge
    }
  }, [])

  useEffect(() => {
    if (token) refreshPoints()
    else setPoints(null)
  }, [token, refreshPoints])

  const handleSignOut = () => {
    logout()
    setToken(null)
    setPoints(null)
  }

  const handleAuthenticated = () => {
    setToken(getAccessToken())
    refreshPoints()
  }

  return (
    <div className="safe-app flex min-h-dvh min-h-svh flex-col overflow-x-clip">
      <Header
        points={points}
        signedIn={Boolean(token)}
        onSignOut={handleSignOut}
      />

      <main className="safe-pb mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-8">
        <div className="animate-fade-up surface-noise relative overflow-hidden rounded-2xl bg-[#FBFAF7]/95 p-3 shadow-[0_20px_50px_-28px_rgba(30,43,34,0.45)] ring-1 ring-[#1E2B22]/8 sm:rounded-[1.75rem] sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 hidden h-56 w-56 rounded-full bg-[#346F4B]/10 blur-2xl sm:block" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 hidden h-48 w-48 rounded-full bg-[#1E2B22]/5 blur-2xl sm:block" />
          <div className="relative min-w-0">
            {!token ? (
              <AuthGate onAuthenticated={handleAuthenticated} />
            ) : (
              <Rewards onPointsChange={setPoints} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
