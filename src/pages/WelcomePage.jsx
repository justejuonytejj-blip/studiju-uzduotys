import { useState } from 'react'
import { signOut } from '../lib/auth.js'
import './RegisterPage.css'

function WelcomePage({ email }) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSignOut() {
    setErrorMessage('')
    setIsSigningOut(true)

    try {
      const { error } = await signOut()

      if (error) {
        setErrorMessage('Nepavyko atsijungti. Bandykite dar kartą.')
      }
    } catch {
      setErrorMessage('Nepavyko atsijungti. Bandykite dar kartą.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <p className="register-kicker">Studijų užduotys</p>
        <h1>Sveiki prisijungę!</h1>
        <p className="register-lead">{email}</p>

        {errorMessage ? (
          <p className="register-message register-message--error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <form className="register-form" onSubmit={(event) => event.preventDefault()}>
          <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? 'Atsijungiama...' : 'Atsijungti'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default WelcomePage
