import { useEffect, useRef, useState } from 'react'
import {
  formatDueDateLt,
  getDueDateWarning,
  toDateInputValue,
  toDueDatePayload,
} from '../lib/dueDate.js'
import { taskMatchesSearch } from '../lib/taskSearch.js'
import { fetchUserCourses } from '../lib/courses.js'
import {
  createUserTask,
  deleteUserTask,
  fetchUserTasks,
  setTaskCompletion,
  updateUserTask,
} from '../lib/tasks.js'

function foundTasksLabel(count) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `Rasta ${count} užduotis`
  }

  if (mod10 >= 2 && mod10 <= 9 && (mod100 < 10 || mod100 >= 20)) {
    return `Rastos ${count} užduotys`
  }

  return `Rasta ${count} užduočių`
}

function priorityLabel(priority) {
  if (priority === 'high') {
    return 'Skubu'
  }
  if (priority === 'normal') {
    return 'Įprasta'
  }
  return priority
}

function FilterSelect({ label, value, options, onChange, ariaLabel }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef(null)
  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="dashboard-task-filter" ref={wrapRef}>
      <span>{label}</span>
      <button
        type="button"
        className={`dashboard-filter-select${isOpen ? ' is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selected?.label}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5.2 7.5 10 12.3l4.8-4.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen ? (
        <ul className="dashboard-filter-menu" role="listbox">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={option.value === value ? 'is-selected' : undefined}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
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
  const [dueDate, setDueDate] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [canRetryRequest, setCanRetryRequest] = useState(false)
  const [canRetryDelete, setCanRetryDelete] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [completingTaskId, setCompletingTaskId] = useState(null)
  const [completionError, setCompletionError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCourseId, setFilterCourseId] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const taskSnapshotIdsRef = useRef([])
  const pendingTaskRef = useRef({ title: '', courseId: '', priority: 'normal', dueDate: null })
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
    setDueDate('')
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
    setDueDate(toDateInputValue(task.due_date))
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
      dueDate: toDueDatePayload(dueDate),
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
      setDueDate('')
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
      setDueDate('')
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
        dueDate: pending.dueDate,
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
      dueDate: toDueDatePayload(dueDate),
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

  async function handleToggleCompletion(task) {
    const nextCompleted = !task.is_completed
    setCompletingTaskId(task.id)
    setCompletionError('')
    setSuccessMessage('')

    try {
      const { data, error } = await setTaskCompletion({
        taskId: task.id,
        currentCourseId: task.course_id,
        userCourseIds,
        isCompleted: nextCompleted,
      })

      if (error || !data) {
        setCompletionError('Nepavyko pakeisti užduoties būsenos. Bandykite dar kartą.')
        return
      }

      setTasks((current) => current.map((item) => (item.id === data.id ? data : item)))
      setSuccessMessage(
        nextCompleted ? 'Užduotis pažymėta kaip atlikta' : 'Užduotis pažymėta kaip neatlikta',
      )
    } catch {
      setCompletionError('Nepavyko pakeisti užduoties būsenos. Bandykite dar kartą.')
    } finally {
      setCompletingTaskId(null)
    }
  }

  function clearTaskFilters() {
    setSearchQuery('')
    setFilterCourseId('')
    setFilterPriority('')
    setFilterStatus('')
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = taskMatchesSearch(task, searchQuery)
    const matchesCourse = !filterCourseId || task.course_id === filterCourseId
    const matchesPriority = !filterPriority || task.priority === filterPriority
    const matchesStatus =
      !filterStatus ||
      (filterStatus === 'completed' && Boolean(task.is_completed)) ||
      (filterStatus === 'incomplete' && !task.is_completed)

    return matchesSearch && matchesCourse && matchesPriority && matchesStatus
  })

  const hasActiveFilters = Boolean(
    searchQuery.trim() || filterCourseId || filterPriority || filterStatus,
  )
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

      {completionError ? (
        <div className="dashboard-banner dashboard-banner--error" role="alert">
          <p>{completionError}</p>
        </div>
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
          <>
            <div className="dashboard-task-filters">
              <label className="dashboard-task-filter">
                <span>Paieška</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Ieškoti užduoties..."
                  aria-label="Ieškoti užduoties"
                />
              </label>

              <FilterSelect
                label="Studijų dalykas"
                value={filterCourseId}
                ariaLabel="Filtruoti pagal studijų dalyką"
                onChange={setFilterCourseId}
                options={[
                  { value: '', label: 'Visi dalykai' },
                  ...courses.map((course) => ({ value: course.id, label: course.name })),
                ]}
              />

              <FilterSelect
                label="Prioritetas"
                value={filterPriority}
                ariaLabel="Filtruoti pagal prioritetą"
                onChange={setFilterPriority}
                options={[
                  { value: '', label: 'Visi prioritetai' },
                  { value: 'normal', label: 'Įprasta' },
                  { value: 'high', label: 'Skubu' },
                ]}
              />

              <FilterSelect
                label="Būsena"
                value={filterStatus}
                ariaLabel="Filtruoti pagal būseną"
                onChange={setFilterStatus}
                options={[
                  { value: '', label: 'Visos užduotys' },
                  { value: 'completed', label: 'Atliktos' },
                  { value: 'incomplete', label: 'Neatliktos' },
                ]}
              />

              {hasActiveFilters && filteredTasks.length > 0 ? (
                <button type="button" className="dashboard-cancel" onClick={clearTaskFilters}>
                  Išvalyti filtrus
                </button>
              ) : null}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="dashboard-empty dashboard-empty--filters">
                <h3>Pagal pasirinktus filtrus užduočių nerasta</h3>
                <button type="button" className="dashboard-add" onClick={clearTaskFilters}>
                  Išvalyti filtrus
                </button>
              </div>
            ) : (
              <>
                <p className="dashboard-task-count">{foundTasksLabel(filteredTasks.length)}</p>
                <ul className="dashboard-task-list">
                {filteredTasks.map((task) => {
                  const formattedDueDate = formatDueDateLt(task.due_date)
                  const dueWarning = getDueDateWarning({
                    dueDate: task.due_date,
                    isCompleted: task.is_completed,
                  })

                  return (
                  <li
                    key={task.id}
                    className={`dashboard-task-card${task.is_completed ? ' is-completed' : ''}`}
                  >
                    <label className="dashboard-task-check">
                      <input
                        type="checkbox"
                        checked={Boolean(task.is_completed)}
                        disabled={completingTaskId === task.id}
                        onChange={() => handleToggleCompletion(task)}
                        aria-label={
                          task.is_completed ? 'Pažymėti kaip neatliktą' : 'Pažymėti kaip atliktą'
                        }
                      />
                    </label>
                    <div className="dashboard-task-main">
                      <h3>{task.title}</h3>
                      <p className="dashboard-task-course">
                        {task.courses?.name || 'Nepriskirtas dalykas'}
                      </p>
                      <div className="dashboard-task-meta">
                        {formattedDueDate ? (
                          <span className="dashboard-task-due">
                            <span aria-hidden="true">📅</span>
                            {formattedDueDate}
                          </span>
                        ) : null}
                        <span className={`dashboard-priority dashboard-priority--${task.priority}`}>
                          {task.priority === 'high' ? <span aria-hidden="true">🔥</span> : null}
                          {priorityLabel(task.priority)}
                        </span>
                        {dueWarning === 'upcoming' ? (
                          <span className="dashboard-task-chip dashboard-task-chip--upcoming">
                            Artėja terminas
                          </span>
                        ) : null}
                        {dueWarning === 'overdue' ? (
                          <span className="dashboard-task-chip dashboard-task-chip--overdue">
                            Pavėluota
                          </span>
                        ) : null}
                        {task.is_completed ? (
                          <span className="dashboard-task-chip dashboard-task-chip--done">
                            Atlikta
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="dashboard-task-actions">
                      <button
                        type="button"
                        className="dashboard-task-icon-btn"
                        onClick={() => openEditModal(task)}
                        aria-label="Redaguoti užduotį"
                        title="Redaguoti"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                          <path
                            d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M13.7 6.8 17.2 10.3"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="dashboard-task-icon-btn dashboard-task-icon-btn--danger"
                        onClick={() => openDeleteModal(task)}
                        aria-label="Ištrinti užduotį"
                        title="Ištrinti"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                          <path
                            d="M5 7h14M10 7V5h4v2M8 7v12h8V7"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                  )
                })}
              </ul>
              </>
            )}
          </>
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

            <label htmlFor="task-due-date">Atlikti iki</label>
            <div className="dashboard-due-field">
              <input
                id="task-due-date"
                name="dueDate"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={isSaving}
              />
              {dueDate ? (
                <button
                  type="button"
                  className="dashboard-due-clear"
                  onClick={() => setDueDate('')}
                  disabled={isSaving}
                >
                  Pašalinti terminą
                </button>
              ) : null}
            </div>

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
