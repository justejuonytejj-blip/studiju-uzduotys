import { useEffect, useMemo, useState } from 'react'
import { fetchUserTasks } from '../lib/tasks.js'

const WEEKDAY_LABELS = ['Sk', 'Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št']

function localDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildLastSevenDays(tasks) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - index))
    const key = localDateKey(day)
    const count = tasks.filter((task) => {
      if (!task.is_completed || !task.completed_at) {
        return false
      }
      return localDateKey(new Date(task.completed_at)) === key
    }).length

    return {
      key,
      label: WEEKDAY_LABELS[day.getDay()],
      dateLabel: `${day.getDate()}.${day.getMonth() + 1}`,
      count,
    }
  })
}

function ProgressPanel({ userId }) {
  const [tasks, setTasks] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')

  async function loadProgress() {
    setLoadState('loading')
    setLoadError('')

    const { data, error } = await fetchUserTasks(userId)

    if (error) {
      setLoadState('error')
      setLoadError('Nepavyko įkelti pažangos. Bandykite dar kartą.')
      return
    }

    setTasks(data ?? [])
    setLoadState('success')
  }

  useEffect(() => {
    loadProgress()
  }, [userId])

  const total = tasks.length
  const completed = tasks.filter((task) => task.is_completed).length
  const remaining = total - completed
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  const chartDays = useMemo(() => buildLastSevenDays(tasks), [tasks])
  const maxCount = Math.max(...chartDays.map((day) => day.count), 1)

  return (
    <>
      <section className="dashboard-hero">
        <h1>Mano pažanga</h1>
        <p>Sekite, kiek užduočių jau atlikta ir kaip sekėsi pastarąsias 7 dienas.</p>
      </section>

      {loadState === 'loading' ? (
        <p className="dashboard-status">Įkeliama pažanga...</p>
      ) : null}

      {loadState === 'error' ? (
        <div className="dashboard-status dashboard-status--error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="dashboard-add" onClick={loadProgress}>
            Bandyti dar kartą
          </button>
        </div>
      ) : null}

      {loadState === 'success' && total === 0 ? (
        <div className="dashboard-empty">
          <div className="dashboard-empty-art" aria-hidden="true">
            📈
          </div>
          <h3>Dar nėra užduočių</h3>
          <p>Pridėk užduočių ir pažymėk jas atliktomis, kad čia atsirastų statistika.</p>
        </div>
      ) : null}

      {loadState === 'success' && total > 0 ? (
        <>
          <section className="progress-stats" aria-label="Užduočių statistika">
            <article className="progress-stat">
              <p>Viso užduočių</p>
              <strong>{total}</strong>
            </article>
            <article className="progress-stat">
              <p>Atlikta</p>
              <strong>{completed}</strong>
            </article>
            <article className="progress-stat">
              <p>Neatlikta</p>
              <strong>{remaining}</strong>
            </article>
            <article className="progress-stat">
              <p>Atlikimo procentas</p>
              <strong>{percent}%</strong>
            </article>
          </section>

          <section className="progress-chart-wrap" aria-label="Paskutinių 7 dienų grafikas">
            <h2>Atlikta per 7 dienas</h2>
            <div className="progress-chart">
              {chartDays.map((day) => (
                <div key={day.key} className="progress-chart-col">
                  <span className="progress-chart-count">{day.count}</span>
                  <div className="progress-chart-track">
                    <div
                      className="progress-chart-bar"
                      style={{
                        height: day.count === 0 ? '0%' : `${(day.count / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="progress-chart-label">{day.label}</span>
                  <span className="progress-chart-date">{day.dateLabel}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </>
  )
}

export default ProgressPanel
