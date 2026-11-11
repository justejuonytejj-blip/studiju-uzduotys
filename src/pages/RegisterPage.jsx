import { useState } from 'react'
import { getSignUpErrorMessage, signUpWithEmail } from '../lib/auth.js'
import './RegisterPage.css'

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
    <main className="register-page">
      <section className="register-card">
        <p className="register-kicker">Studijų užduotys</p>
        <h1>Registracija</h1>
        <p className="register-lead">
          Sukurkite paskyrą ir pradėkite valdyti studijų užduotis vienoje vietoje.
        </p>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">El. paštas</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            placeholder="pvz. studentas1@example.com"
          />

          <label htmlFor="password">Slaptažodis</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
          />

          <label htmlFor="passwordRepeat">Pakartoti slaptažodį</label>
          <input
            id="passwordRepeat"
            name="passwordRepeat"
            type="password"
            autoComplete="new-password"
            value={passwordRepeat}
            onChange={(event) => setPasswordRepeat(event.target.value)}
            disabled={isSubmitting}
          />

          {errorMessage ? (
            <div className="register-message register-message--error" role="alert">
              <p>{errorMessage}</p>
              {canRetry ? (
                <button
                  type="button"
                  className="register-retry"
                  onClick={submitRegistration}
                  disabled={isSubmitting}
                >
                  Bandyti dar kartą
                </button>
              ) : null}
            </div>
          ) : null}

          {successMessage ? (
            <p className="register-message register-message--success" role="status">
              {successMessage}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registruojama...' : 'Registruotis'}
          </button>
        </form>

        <p className="register-switch">
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
