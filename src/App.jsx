import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase.js'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

function App() {
  const [session, setSession] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [authView, setAuthView] = useState('register')

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session)
        setIsReady(true)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (!isReady) {
    return (
      <main className="session-check" aria-live="polite">
        <p>Tikrinama sesija...</p>
      </main>
    )
  }

  if (session) {
    return <DashboardPage session={session} />
  }

  if (authView === 'login') {
    return <LoginPage onGoToRegister={() => setAuthView('register')} />
  }

  return <RegisterPage onGoToLogin={() => setAuthView('login')} />
}

export default App
