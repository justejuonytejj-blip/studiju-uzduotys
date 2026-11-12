import { useState } from 'react'
import { getSignUpErrorMessage, signUpWithEmail } from '../lib/auth.js'
import { CapIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from './AuthIcons.jsx'
import './AuthPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegistration({ email, password, passwordRepeat }) {
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return 'Įveskite el. paštą.'
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return 'Įveskite tinkamą el. pašto adresą.'
  }

  if (password.length < 6) {
    return 'Slaptažodis turi būti bent 6 simbolių.'
  }

  if (password !== passwordRepeat) {
    return 'Slaptažodžiai nesutampa.'
  }

  return null
}

function RegisterPage({ onGoToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [canRetry, setCanRetry] = useState(false)

  async function submitRegistration() {
    setErrorMessage('')
    setSuccessMessage('')
    setCanRetry(false)
    setIsSubmitting(true)

    try {
      const { data, error } = await signUpWithEmail(email.trim(), password)

      if (error) {
        setErrorMessage(getSignUpErrorMessage(error))
        setCanRetry(true)
        return
      }

      const identities = data?.user?.identities
      if (data?.user && Array.isArray(identities) && identities.length === 0) {
        setErrorMessage('Šis el. paštas jau užregistruotas.')
        setCanRetry(false)
        return
      }

      if (!data?.user) {
        setErrorMessage('Nepavyko užsiregistruoti. Bandykite dar kartą.')
        setCanRetry(true)
        return
      }

      if (!data.session) {
        setSuccessMessage(
          'Paskyra sukurta. Jei reikės, patvirtinkite el. paštą ir tada prisijunkite.',
        )
        return
      }

      setSuccessMessage('Paskyra sėkmingai sukurta.')
    } catch {
      setErrorMessage('Nepavyko prisijungti prie serverio. Bandykite dar kartą.')
      setCanRetry(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateRegistration({
      email,
      password,
      passwordRepeat,
    })

    if (validationError) {
      setErrorMessage(validationError)
      setSuccessMessage('')
      setCanRetry(false)
      return
    }

    await submitRegistration()
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-icon">
          <CapIcon />
        </div>
        <h1>Studijų užduotys</h1>
        <p className="auth-kicker">Registracija</p>
        <p className="auth-lead">
          Sukurkite paskyrą ir pradėkite valdyti studijų užduotis.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-field auth-field--email" htmlFor="email">
            <span className="auth-field-icon">
              <MailIcon />
            </span>
            <input
              id="email"
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

          <label className="auth-field" htmlFor="password">
            <span className="auth-field-icon">
              <LockIcon />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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

          <label className="auth-field" htmlFor="passwordRepeat">
            <span className="auth-field-icon">
              <LockIcon />
            </span>
            <input
              id="passwordRepeat"
              name="passwordRepeat"
              type={showPasswordRepeat ? 'text' : 'password'}
              autoComplete="new-password"
              value={passwordRepeat}
              onChange={(event) => setPasswordRepeat(event.target.value)}
              disabled={isSubmitting}
              placeholder="Pakartoti slaptažodį"
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPasswordRepeat((value) => !value)}
              disabled={isSubmitting}
              aria-label={
                showPasswordRepeat ? 'Slėpti pakartotą slaptažodį' : 'Rodyti pakartotą slaptažodį'
              }
            >
              {showPasswordRepeat ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </label>

          {errorMessage ? (
            <div className="auth-message auth-message--error" role="alert">
              <p>{errorMessage}</p>
              {canRetry ? (
                <button
                  type="button"
                  className="auth-retry"
                  onClick={submitRegistration}
                  disabled={isSubmitting}
                >
                  Bandyti dar kartą
                </button>
              ) : null}
            </div>
          ) : null}

          {successMessage ? (
            <p className="auth-message auth-message--success" role="status">
              {successMessage}
            </p>
          ) : null}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registruojama...' : 'Registruotis'}
          </button>
        </form>

        <p className="auth-switch">
          Jau turite paskyrą?{' '}
          <a
            href="#prisijungti"
            onClick={(event) => {
              event.preventDefault()
              onGoToLogin()
            }}
          >
            Prisijungti
          </a>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
