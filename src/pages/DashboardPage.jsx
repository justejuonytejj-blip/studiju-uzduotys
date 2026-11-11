import { useEffect, useRef, useState } from 'react'
import { signOut } from '../lib/auth.js'
import { createUserCourse, fetchUserCourses } from '../lib/courses.js'
import TasksPanel from './TasksPanel.jsx'
import './DashboardPage.css'

const COURSE_VARIANTS = ['violet', 'blue', 'rose', 'teal']

function getInitials(email) {
  const localPart = (email || '').split('@')[0]
  const parts = localPart.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (localPart.slice(0, 2) || 'VU').toUpperCase()
}

function DashboardPage({ session }) {
  const user = session.user
  const email = user.email || ''
  const initials = getInitials(email)

  const [courses, setCourses] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [canRetryRequest, setCanRetryRequest] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeView, setActiveView] = useState('courses')
  const courseSnapshotIdsRef = useRef([])
  const pendingCourseNameRef = useRef('')

  async function loadCourses() {
    setLoadState('loading')
    setLoadError('')

    const { data, error } = await fetchUserCourses(user.id)

    if (error) {
      setLoadState('error')
      setLoadError('Nepavyko įkelti studijų dalykų. Bandykite dar kartą.')
      return
    }

    setCourses(data ?? [])
    setLoadState('success')
  }

  useEffect(() => {
    loadCourses()
  }, [user.id])

  function openCreateModal() {
    setCourseName('')
    setFormError('')
    setCanRetryRequest(false)
    setIsModalOpen(true)
  }

  async function persistCourse({ isRetry }) {
    const name = pendingCourseNameRef.current

    try {
      if (isRetry) {
        const latest = await fetchUserCourses(user.id)
        if (latest.error) {
          setFormError('Nepavyko patikrinti, ar dalykas jau sukurtas. Bandykite dar kartą.')
          setCanRetryRequest(true)
          return false
        }

        const alreadyCreated = (latest.data ?? []).find(
          (course) =>
            course.name.trim() === name && !courseSnapshotIdsRef.current.includes(course.id),
        )

        if (alreadyCreated) {
          setCourses(latest.data ?? [])
          setLoadState('success')
          return true
        }
      }

      const { data, error } = await createUserCourse(user.id, name)

      if (error || !data) {
        setFormError('Nepavyko išsaugoti dalyko. Bandykite dar kartą.')
        setCanRetryRequest(true)
        return false
      }

      setCourses((current) =>
        current.some((course) => course.id === data.id) ? current : [...current, data],
      )
      setLoadState('success')
      return true
    } catch {
      setFormError('Nepavyko išsaugoti dalyko. Bandykite dar kartą.')
      setCanRetryRequest(true)
      return false
    }
  }

  function closeCreateModal() {
    if (isSaving) {
      return
    }
    setIsModalOpen(false)
    setCourseName('')
    setFormError('')
    setCanRetryRequest(false)
  }

  async function handleCreateCourse(event) {
    event.preventDefault()
    const name = courseName.trim()

    if (!name) {
      setFormError('Įveskite dalyko pavadinimą.')
      setCanRetryRequest(false)
      return
    }

    pendingCourseNameRef.current = name
    courseSnapshotIdsRef.current = courses.map((course) => course.id)
    setIsSaving(true)
    setFormError('')
    setCanRetryRequest(false)
    setSuccessMessage('')

    const saved = await persistCourse({ isRetry: false })

    if (saved) {
      setSuccessMessage('Dalykas sėkmingai sukurtas')
      setIsModalOpen(false)
      setCourseName('')
    }

    setIsSaving(false)
  }

  async function retryCreateCourse() {
    if (!pendingCourseNameRef.current || isSaving) {
      return
    }

    setIsSaving(true)
    setFormError('')

    const saved = await persistCourse({ isRetry: true })

    if (saved) {
      setSuccessMessage('Dalykas sėkmingai sukurtas')
      setIsModalOpen(false)
      setCourseName('')
    }

    setIsSaving(false)
  }

  async function handleSignOut() {
    setSignOutError('')
    setIsSigningOut(true)

    try {
      const { error } = await signOut()
      if (error) {
        setSignOutError('Nepavyko atsijungti. Bandykite dar kartą.')
      }
    } catch {
      setSignOutError('Nepavyko atsijungti. Bandykite dar kartą.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-glow" aria-hidden="true" />

      <button
        type="button"
        className="dashboard-menu-toggle"
        onClick={() => setIsMenuOpen((open) => !open)}
        aria-expanded={isMenuOpen}
        aria-controls="dashboard-sidebar"
      >
        Meniu
      </button>

      {isMenuOpen ? (
        <button
          type="button"
          className="dashboard-backdrop"
          aria-label="Uždaryti meniu"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <aside
        id="dashboard-sidebar"
        className={`dashboard-sidebar${isMenuOpen ? ' is-open' : ''}`}
      >
        <div className="dashboard-brand">
          <span className="dashboard-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M7 12.2v4.1c0 .4.7 1.4 5 2.4 4.3-1 5-2 5-2.4v-4.1"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </span>
          <span>Studijų užduotys</span>
        </div>

        <nav className="dashboard-nav" aria-label="Pagrindinė navigacija">
          <button
            type="button"
            className={`dashboard-nav-item${activeView === 'courses' ? ' is-active' : ''}`}
            onClick={() => {
              setActiveView('courses')
              setIsMenuOpen(false)
            }}
          >
            <span className="dashboard-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
                <rect x="14" y="3" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
                <rect x="3" y="14" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
                <rect x="14" y="14" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            Mano dalykai
          </button>
          <button
            type="button"
            className={`dashboard-nav-item${activeView === 'tasks' ? ' is-active' : ''}`}
            onClick={() => {
              setActiveView('tasks')
              setIsMenuOpen(false)
            }}
          >
            <span className="dashboard-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 6h14M5 12h14M5 18h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            Užduotys
          </button>
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-user">
            <span className="dashboard-avatar" aria-hidden="true">
              {initials}
            </span>
            <button
              type="button"
              className="dashboard-user-button"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              aria-expanded={isUserMenuOpen}
            >
              <span className="dashboard-user-email">{email}</span>
              <span aria-hidden="true">▾</span>
            </button>
            {isUserMenuOpen ? (
              <div className="dashboard-user-menu">
                <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
                  {isSigningOut ? 'Atsijungiama...' : 'Atsijungti'}
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {signOutError ? (
          <div className="dashboard-banner dashboard-banner--error" role="alert">
            <p>{signOutError}</p>
            <button type="button" className="dashboard-retry" onClick={handleSignOut} disabled={isSigningOut}>
              Bandyti dar kartą
            </button>
          </div>
        ) : null}

        {activeView === 'courses' && successMessage ? (
          <p className="dashboard-banner dashboard-banner--success" role="status">
            {successMessage}
          </p>
        ) : null}

        {activeView === 'tasks' ? <TasksPanel userId={user.id} /> : null}

        {activeView === 'courses' ? (
          <>
        <section className="dashboard-hero" id="mano-dalykai">
          <h1>Labas! 👋</h1>
          <p>Tvarkyk savo studijų dalykus ir užduotis vienoje vietoje.</p>
        </section>

        <section className="dashboard-section" aria-labelledby="courses-heading">
          <div className="dashboard-section-head">
            <h2 id="courses-heading">
              <span aria-hidden="true">🎓</span>
              Mano studijų dalykai
            </h2>
            {courses.length > 0 ? (
              <button type="button" className="dashboard-add" onClick={openCreateModal}>
                + Pridėti dalyką
              </button>
            ) : null}
          </div>

          {loadState === 'loading' ? (
            <p className="dashboard-status">Įkeliami studijų dalykai...</p>
          ) : null}

          {loadState === 'error' ? (
            <div className="dashboard-status dashboard-status--error" role="alert">
              <p>{loadError}</p>
              <button type="button" className="dashboard-add" onClick={loadCourses}>
                Bandyti dar kartą
              </button>
            </div>
          ) : null}

          {loadState === 'success' && courses.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-art" aria-hidden="true">
                🎓
              </div>
              <h3>Dar nėra pridėtų dalykų</h3>
              <p>Pridėk pirmą studijų dalyką ir pradėk kurti savo užduočių sąrašą.</p>
              <button type="button" className="dashboard-add" onClick={openCreateModal}>
                + Pridėti pirmą dalyką
              </button>
            </div>
          ) : null}

          {loadState === 'success' && courses.length > 0 ? (
            <ul className="dashboard-grid">
              {courses.map((course, index) => (
                <li
                  key={course.id}
                  className={`dashboard-card dashboard-card--${COURSE_VARIANTS[index % COURSE_VARIANTS.length]}`}
                >
                  <div className="dashboard-card-icon" aria-hidden="true">
                    {index % 4 === 0 ? '</>' : index % 4 === 1 ? 'DB' : index % 4 === 2 ? '▣' : '◈'}
                  </div>
                  <h3>{course.name}</h3>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
          </>
        ) : null}
      </div>

      {activeView === 'courses' && isModalOpen ? (
        <div className="dashboard-modal-wrap">
          <button
            type="button"
            className="dashboard-backdrop"
            aria-label="Uždaryti langą"
            onClick={closeCreateModal}
          />
          <form className="dashboard-modal" onSubmit={handleCreateCourse}>
            <h2>Naujas studijų dalykas</h2>
            <label htmlFor="course-name">Dalyko pavadinimas</label>
            <input
              id="course-name"
              name="courseName"
              value={courseName}
              onChange={(event) => {
                setCourseName(event.target.value)
                if (formError && !canRetryRequest) {
                  setFormError('')
                }
              }}
              disabled={isSaving}
              autoFocus
              placeholder="Pvz. Programavimo pagrindai"
            />
            {formError ? (
              <div className="dashboard-form-error" role="alert">
                <p>{formError}</p>
                {canRetryRequest ? (
                  <button
                    type="button"
                    className="dashboard-retry"
                    onClick={retryCreateCourse}
                    disabled={isSaving}
                  >
                    Bandyti dar kartą
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="dashboard-modal-actions">
              <button type="button" className="dashboard-cancel" onClick={closeCreateModal} disabled={isSaving}>
                Atšaukti
              </button>
              <button type="submit" className="dashboard-add" disabled={isSaving}>
                {isSaving ? 'Saugoma...' : 'Pridėti dalyką'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default DashboardPage
