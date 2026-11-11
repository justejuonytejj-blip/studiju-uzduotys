import { useEffect, useRef, useState } from 'react'
import { fetchUserCourses } from '../lib/courses.js'
import { createUserTask, fetchUserTasks } from '../lib/tasks.js'

function priorityLabel(priority) {
  if (priority === 'high') {
    return 'Skubu'
  }
  if (priority === 'normal') {
    return 'Įprasta'
  }
  return priority
}

function TasksPanel({ userId }) {
  const [courses, setCourses] = useState([])
  const [tasks, setTasks] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [canRetryRequest, setCanRetryRequest] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const taskSnapshotIdsRef = useRef([])
  const pendingTaskRef = useRef({ title: '', courseId: '', priority: 'normal' })

  async function loadTasks() {
    setLoadState('loading')
    setLoadError('')

    const [coursesResult, tasksResult] = await Promise.all([
      fetchUserCourses(userId),
      fetchUserTasks(userId),
    ])

    if (coursesResult.error) {
      setLoadState('error')
      setLoadError('Nepavyko įkelti studijų dalykų. Bandykite dar kartą.')
      return
    }

    if (tasksResult.error) {
      setLoadState('error')
      setLoadError('Nepavyko įkelti užduočių. Bandykite dar kartą.')
      return
    }

    const nextCourses = coursesResult.data ?? []
    setCourses(nextCourses)
    setTasks(tasksResult.data ?? [])
    setLoadState('success')

    if (!courseId && nextCourses.length > 0) {
      setCourseId(nextCourses[0].id)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [userId])

  function openCreateModal() {
    setTitle('')
    setPriority('normal')
    setFormError('')
    setCanRetryRequest(false)
    setCourseId((current) => current || courses[0]?.id || '')
    setIsModalOpen(true)
  }

  function closeCreateModal() {
    if (isSaving) {
      return
    }
    setIsModalOpen(false)
    setFormError('')
    setCanRetryRequest(false)
  }

  async function persistTask({ isRetry }) {
    const pending = pendingTaskRef.current

    try {
      if (isRetry) {
        const latest = await fetchUserTasks(userId)
        if (latest.error) {
          setFormError('Nepavyko patikrinti, ar užduotis jau sukurta. Bandykite dar kartą.')
          setCanRetryRequest(true)
          return false
        }

        const alreadyCreated = (latest.data ?? []).find(
          (task) =>
            task.title.trim() === pending.title &&
            task.course_id === pending.courseId &&
            !taskSnapshotIdsRef.current.includes(task.id),
        )

        if (alreadyCreated) {
          setTasks(latest.data ?? [])
          setLoadState('success')
          return true
        }
      }

      const { data, error } = await createUserTask(pending)

      if (error || !data) {
        setFormError('Nepavyko išsaugoti užduoties. Bandykite dar kartą.')
        setCanRetryRequest(true)
        return false
      }

      setTasks((current) =>
        current.some((task) => task.id === data.id) ? current : [data, ...current],
      )
      setLoadState('success')
      return true
    } catch {
      setFormError('Nepavyko išsaugoti užduoties. Bandykite dar kartą.')
      setCanRetryRequest(true)
      return false
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setFormError('Įveskite užduoties pavadinimą.')
      setCanRetryRequest(false)
      return
    }

    if (!courseId) {
      setFormError('Pasirinkite studijų dalyką.')
      setCanRetryRequest(false)
      return
    }

    if (priority !== 'high' && priority !== 'normal') {
      setFormError('Pasirinkite prioritetą.')
      setCanRetryRequest(false)
      return
    }

    pendingTaskRef.current = {
      title: trimmedTitle,
      courseId,
      priority,
    }
    taskSnapshotIdsRef.current = tasks.map((task) => task.id)
    setIsSaving(true)
    setFormError('')
    setCanRetryRequest(false)
    setSuccessMessage('')

    const saved = await persistTask({ isRetry: false })

    if (saved) {
      setSuccessMessage('Užduotis sėkmingai sukurta')
      setIsModalOpen(false)
      setTitle('')
    }

    setIsSaving(false)
  }

  async function retryCreateTask() {
    if (!pendingTaskRef.current.title || isSaving) {
      return
    }

    setIsSaving(true)
    setFormError('')

    const saved = await persistTask({ isRetry: true })

    if (saved) {
      setSuccessMessage('Užduotis sėkmingai sukurta')
      setIsModalOpen(false)
      setTitle('')
    }

    setIsSaving(false)
  }

  const canCreateTask = courses.length > 0

  return (
    <>
      <section className="dashboard-hero" id="uzduotys">
        <h1>Užduotys</h1>
        <p>Priskirk užduotis studijų dalykams ir pažymėk jų prioritetą.</p>
      </section>

      {successMessage ? (
        <p className="dashboard-banner dashboard-banner--success" role="status">
          {successMessage}
        </p>
      ) : null}

      <section className="dashboard-section" aria-labelledby="tasks-heading">
        <div className="dashboard-section-head">
          <h2 id="tasks-heading">Mano užduotys</h2>
          {canCreateTask ? (
            <button type="button" className="dashboard-add" onClick={openCreateModal}>
              + Pridėti užduotį
            </button>
          ) : null}
        </div>

        {loadState === 'loading' ? (
          <p className="dashboard-status">Įkeliamos užduotys...</p>
        ) : null}

        {loadState === 'error' ? (
          <div className="dashboard-status dashboard-status--error" role="alert">
            <p>{loadError}</p>
            <button type="button" className="dashboard-add" onClick={loadTasks}>
              Bandyti dar kartą
            </button>
          </div>
        ) : null}

        {loadState === 'success' && courses.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-art" aria-hidden="true">
              ✓
            </div>
            <h3>Pirmiausia pridėk studijų dalyką</h3>
            <p>Užduotį galima priskirti tik esamam dalykui. Grįžk į „Mano dalykai“ ir pridėk pirmą dalyką.</p>
          </div>
        ) : null}

        {loadState === 'success' && courses.length > 0 && tasks.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-art" aria-hidden="true">
              ✓
            </div>
            <h3>Dar nėra užduočių</h3>
            <p>Pridėk pirmą užduotį ir priskirk ją studijų dalykui.</p>
            <button type="button" className="dashboard-add" onClick={openCreateModal}>
              + Pridėti pirmą užduotį
            </button>
          </div>
        ) : null}

        {loadState === 'success' && tasks.length > 0 ? (
          <ul className="dashboard-task-list">
            {tasks.map((task) => (
              <li key={task.id} className="dashboard-task-card">
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.courses?.name || 'Nepriskirtas dalykas'}</p>
                </div>
                <span className={`dashboard-priority dashboard-priority--${task.priority}`}>
                  {priorityLabel(task.priority)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {isModalOpen ? (
        <div className="dashboard-modal-wrap">
          <button
            type="button"
            className="dashboard-backdrop"
            aria-label="Uždaryti langą"
            onClick={closeCreateModal}
          />
          <form className="dashboard-modal" onSubmit={handleCreateTask}>
            <h2>Nauja užduotis</h2>

            <label htmlFor="task-title">Užduoties pavadinimas</label>
            <input
              id="task-title"
              name="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                if (formError && !canRetryRequest) {
                  setFormError('')
                }
              }}
              disabled={isSaving}
              autoFocus
              placeholder="Pvz. Paruošti laboratorinį darbą"
            />

            <label htmlFor="task-course">Studijų dalykas</label>
            <select
              id="task-course"
              name="courseId"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              disabled={isSaving}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <label htmlFor="task-priority">Prioritetas</label>
            <select
              id="task-priority"
              name="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              disabled={isSaving}
            >
              <option value="normal">Įprasta</option>
              <option value="high">Skubu</option>
            </select>

            {formError ? (
              <div className="dashboard-form-error" role="alert">
                <p>{formError}</p>
                {canRetryRequest ? (
                  <button
                    type="button"
                    className="dashboard-retry"
                    onClick={retryCreateTask}
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
                {isSaving ? 'Saugoma...' : 'Pridėti užduotį'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}

export default TasksPanel
