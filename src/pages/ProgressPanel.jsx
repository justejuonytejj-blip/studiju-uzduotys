import { useEffect, useMemo, useState } from 'react'
import { fetchUserTasks } from '../lib/tasks.js'

const WEEKDAY_LABELS = ['Sk', 'Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št']
const CHART_TRACK_HEIGHT = 140

function localDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function completedOnLocalDay(task, dayKey) {
  if (!task.is_completed || !task.completed_at) {
    return false
  }

  return localDateKey(new Date(task.completed_at)) === dayKey
}

function buildScaleTicks(maxCount) {
  const top = Math.max(0, maxCount)

  if (top === 0) {
    return [0]
  }

  if (top <= 8) {
    return Array.from({ length: top + 1 }, (_, index) => index)
  }

  const step = Math.ceil(top / 5)
  const ticks = []

  for (let value = 0; value <= top; value += step) {
    ticks.push(value)
  }

  if (ticks[ticks.length - 1] !== top) {
    ticks.push(top)
  }

  return ticks
}

function buildLastSevenDays(tasks) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - index))
    const key = localDateKey(day)
    const count = tasks.filter((task) => completedOnLocalDay(task, key)).length

    return {
      key,
      label: WEEKDAY_LABELS[day.getDay()],
      dateLabel: `${String(day.getDate()).padStart(2, '0')}.${String(day.getMonth() + 1).padStart(2, '0')}`,
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
  const maxCount = Math.max(...chartDays.map((day) => day.count), 0)
  const scaleTicks = buildScaleTicks(maxCount)
  const scaleLabels = [...scaleTicks].reverse()

  return (
    <>
      <section className="dashboard-hero">
        <h1>Statistika</h1>
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
              <div className="progress-chart-yaxis" aria-hidden="true">
                <div className="progress-chart-yaxis-spacer" />
                <div
                  className={`progress-chart-scale${scaleLabels.length === 1 ? ' is-zero' : ''}`}
                  style={{ height: `${CHART_TRACK_HEIGHT}px` }}
                >
                  {scaleLabels.map((tick, index) => (
                    <span key={`${tick}-${index}`}>{tick}</span>
                  ))}
                </div>
                <div className="progress-chart-yaxis-footer" />
              </div>
              {chartDays.map((day) => (
                <div key={day.key} className="progress-chart-col">
                  <span className="progress-chart-count">{day.count}</span>
                  <div
                    className="progress-chart-track"
                    style={{ height: `${CHART_TRACK_HEIGHT}px` }}
                  >
                    <div
                      className="progress-chart-bar"
                      style={{
                        height:
                          maxCount === 0 || day.count === 0
                            ? '0px'
                            : `${(day.count / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="progress-chart-col-footer">
                    <span className="progress-chart-label">{day.label}</span>
                    <span className="progress-chart-date">{day.dateLabel}</span>
                  </div>
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
