import { useState } from 'react'
import { getSignInErrorMessage, signInWithEmail } from '../lib/auth.js'
import './RegisterPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateLogin({ email, password }) {
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return 'Įveskite el. paštą.'
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return 'Įveskite tinkamą el. pašto adresą.'
  }

  if (!password) {
    return 'Įveskite slaptažodį.'
  }

  return null
}

function LoginPage({ onGoToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    const validationError = validateLogin({ email, password })

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await signInWithEmail(email.trim(), password)

      if (error) {
        setErrorMessage(getSignInErrorMessage(error))
        return
      }

      if (!data?.session) {
        setErrorMessage('Nepavyko prisijungti. Bandykite dar kartą.')
      }
    } catch {
      setErrorMessage('Nepavyko prisijungti prie serverio. Bandykite dar kartą.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <p className="register-kicker">Studijų užduotys</p>
        <h1>Prisijungimas</h1>
        <p className="register-lead">
          Prisijunkite, kad galėtumėte tęsti darbą su studijų užduotimis.
        </p>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="login-email">El. paštas</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            placeholder="pvz. studentas1@example.com"
          />

          <label htmlFor="login-password">Slaptažodis</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
          />

          {errorMessage ? (
            <p className="register-message register-message--error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Jungiamasi...' : 'Prisijungti'}
          </button>
        </form>

        <p className="register-switch">
          Neturite paskyros?{' '}
          <a
            href="#registruotis"
            onClick={(event) => {
              event.preventDefault()
              onGoToRegister()
            }}
          >
            Registruotis
          </a>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
