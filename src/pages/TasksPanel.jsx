import { useEffect, useRef, useState } from 'react'
import { fetchUserCourses } from '../lib/courses.js'
import { createUserTask, deleteUserTask, fetchUserTasks, updateUserTask } from '../lib/tasks.js'

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
  const [formMode, setFormMode] = useState(null)
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [editingTask, setEditingTask] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [canRetryRequest, setCanRetryRequest] = useState(false)
  const [canRetryDelete, setCanRetryDelete] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const taskSnapshotIdsRef = useRef([])
  const pendingTaskRef = useRef({ title: '', courseId: '', priority: 'normal' })
  const userCourseIds = courses.map((course) => course.id)

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
    setEditingTask(null)
    setTitle('')
    setPriority('normal')
    setFormError('')
    setCanRetryRequest(false)
    setCourseId((current) => current || courses[0]?.id || '')
    setFormMode('create')
  }

  function openEditModal(task) {
    setEditingTask(task)
    setTitle(task.title)
    setCourseId(task.course_id)
    setPriority(task.priority === 'high' ? 'high' : 'normal')
    setFormError('')
    setCanRetryRequest(false)
    setFormMode('edit')
  }

  function closeFormModal() {
    if (isSaving) {
      return
    }
    setFormMode(null)
    setEditingTask(null)
    setFormError('')
    setCanRetryRequest(false)
  }

  function openDeleteModal(task) {
    setTaskToDelete(task)
    setDeleteError('')
    setCanRetryDelete(false)
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return
    }
    setTaskToDelete(null)
    setDeleteError('')
    setCanRetryDelete(false)
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
      setFormMode(null)
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
      setFormMode(null)
      setTitle('')
    }

    setIsSaving(false)
  }

  async function persistUpdatedTask() {
    const pending = pendingTaskRef.current

    try {
      const { data, error } = await updateUserTask({
        taskId: pending.taskId,
        title: pending.title,
        courseId: pending.courseId,
        priority: pending.priority,
        currentCourseId: pending.currentCourseId,
        userCourseIds,
      })

      if (error || !data) {
        setFormError('Nepavyko atnaujinti užduoties. Bandykite dar kartą.')
        setCanRetryRequest(true)
        return false
      }

      setTasks((current) => current.map((task) => (task.id === data.id ? data : task)))
      setLoadState('success')
      return true
    } catch {
      setFormError('Nepavyko atnaujinti užduoties. Bandykite dar kartą.')
      setCanRetryRequest(true)
      return false
    }
  }

  async function handleUpdateTask(event) {
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
      taskId: editingTask.id,
      title: trimmedTitle,
      courseId,
      priority,
      currentCourseId: editingTask.course_id,
    }
    setIsSaving(true)
    setFormError('')
    setCanRetryRequest(false)
    setSuccessMessage('')

    const saved = await persistUpdatedTask()

    if (saved) {
      setSuccessMessage('Užduotis sėkmingai atnaujinta')
      setFormMode(null)
      setEditingTask(null)
    }

    setIsSaving(false)
  }

  async function retryUpdateTask() {
    if (!pendingTaskRef.current.taskId || isSaving) {
      return
    }

    setIsSaving(true)
    setFormError('')

    const saved = await persistUpdatedTask()

    if (saved) {
      setSuccessMessage('Užduotis sėkmingai atnaujinta')
      setFormMode(null)
      setEditingTask(null)
    }

    setIsSaving(false)
  }

  async function persistDeletedTask() {
    const task = taskToDelete
    if (!task) {
      return false
    }

    try {
      const { data, error } = await deleteUserTask({
        taskId: task.id,
        currentCourseId: task.course_id,
        userCourseIds,
      })

      if (error || !data) {
        setDeleteError('Nepavyko ištrinti užduoties. Bandykite dar kartą.')
        setCanRetryDelete(true)
        return false
      }

      setTasks((current) => current.filter((item) => item.id !== task.id))
      setLoadState('success')
      return true
    } catch {
      setDeleteError('Nepavyko ištrinti užduoties. Bandykite dar kartą.')
      setCanRetryDelete(true)
      return false
    }
  }

  async function handleDeleteTask() {
    setIsDeleting(true)
    setDeleteError('')
    setCanRetryDelete(false)
    setSuccessMessage('')

    const deleted = await persistDeletedTask()

    if (deleted) {
      setSuccessMessage('Užduotis sėkmingai ištrinta')
      setTaskToDelete(null)
    }

    setIsDeleting(false)
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
                  <div className="dashboard-task-actions">
                    <button type="button" onClick={() => openEditModal(task)}>
                      Redaguoti
                    </button>
                    <button type="button" onClick={() => openDeleteModal(task)}>
                      Ištrinti
                    </button>
                  </div>
                </div>
                <span className={`dashboard-priority dashboard-priority--${task.priority}`}>
                  {priorityLabel(task.priority)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {formMode ? (
        <div className="dashboard-modal-wrap">
          <button
            type="button"
            className="dashboard-backdrop"
            aria-label="Uždaryti langą"
            onClick={closeFormModal}
          />
          <form
            className="dashboard-modal"
            onSubmit={formMode === 'edit' ? handleUpdateTask : handleCreateTask}
          >
            <h2>{formMode === 'edit' ? 'Redaguoti užduotį' : 'Nauja užduotis'}</h2>

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
                    onClick={formMode === 'edit' ? retryUpdateTask : retryCreateTask}
                    disabled={isSaving}
                  >
                    Bandyti dar kartą
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="dashboard-modal-actions">
              <button type="button" className="dashboard-cancel" onClick={closeFormModal} disabled={isSaving}>
                Atšaukti
              </button>
              <button type="submit" className="dashboard-add" disabled={isSaving}>
                {isSaving ? 'Saugoma...' : formMode === 'edit' ? 'Išsaugoti' : 'Pridėti užduotį'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {taskToDelete ? (
        <div className="dashboard-modal-wrap">
          <button
            type="button"
            className="dashboard-backdrop"
            aria-label="Uždaryti langą"
            onClick={closeDeleteModal}
          />
          <div className="dashboard-modal">
            <h2>Ištrinti užduotį?</h2>
            <p className="dashboard-delete-text">
              Ar tikrai norite ištrinti užduotį „{taskToDelete.title}“? Šio veiksmo atšaukti negalima.
            </p>
            {deleteError ? (
              <div className="dashboard-form-error" role="alert">
                <p>{deleteError}</p>
                {canRetryDelete ? (
                  <button
                    type="button"
                    className="dashboard-retry"
                    onClick={handleDeleteTask}
                    disabled={isDeleting}
                  >
                    Bandyti dar kartą
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="dashboard-modal-actions">
              <button type="button" className="dashboard-cancel" onClick={closeDeleteModal} disabled={isDeleting}>
                Atšaukti
              </button>
              <button
                type="button"
                className="dashboard-add dashboard-add--danger"
                onClick={handleDeleteTask}
                disabled={isDeleting}
              >
                {isDeleting ? 'Trinama...' : 'Ištrinti'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default TasksPanel
