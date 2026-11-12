import { useState } from 'react'
import { getSignInErrorMessage, signInWithEmail } from '../lib/auth.js'
import { CapIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from './AuthIcons.jsx'
import './AuthPage.css'

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
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [canRetry, setCanRetry] = useState(false)

  async function submitLogin() {
    setErrorMessage('')
    setCanRetry(false)
    setIsSubmitting(true)

    try {
      const { data, error } = await signInWithEmail(email.trim(), password)

      if (error) {
        setErrorMessage(getSignInErrorMessage(error))
        setCanRetry(true)
        return
      }

      if (!data?.session) {
        setErrorMessage('Nepavyko prisijungti. Bandykite dar kartą.')
        setCanRetry(true)
      }
    } catch {
      setErrorMessage('Nepavyko prisijungti prie serverio. Bandykite dar kartą.')
      setCanRetry(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateLogin({ email, password })

    if (validationError) {
      setErrorMessage(validationError)
      setCanRetry(false)
      return
    }

    await submitLogin()
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-icon">
          <CapIcon />
        </div>
        <h1>Studijų užduotys</h1>
        <p className="auth-lead">Prisijunk prie savo paskyros</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-field auth-field--email" htmlFor="login-email">
            <span className="auth-field-icon">
              <MailIcon />
            </span>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              placeholder="El. paštas"
            />
          </label>

          <label className="auth-field" htmlFor="login-password">
            <span className="auth-field-icon">
              <LockIcon />
            </span>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              placeholder="Slaptažodis"
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword((value) => !value)}
              disabled={isSubmitting}
              aria-label={showPassword ? 'Slėpti slaptažodį' : 'Rodyti slaptažodį'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </label>

          {errorMessage ? (
            <div className="auth-message auth-message--error" role="alert">
              <p>{errorMessage}</p>
              {canRetry ? (
                <button
                  type="button"
                  className="auth-retry"
                  onClick={submitLogin}
                  disabled={isSubmitting}
                >
                  Bandyti dar kartą
                </button>
              ) : null}
            </div>
          ) : null}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Jungiamasi...' : 'Prisijungti'}
          </button>
        </form>

        <p className="auth-switch">
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
