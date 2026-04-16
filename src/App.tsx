import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { CONTEXTS } from './data/contexts'
import {
  DEFAULT_PREFERENCES,
  EFFORT_OPTIONS,
  PLACEHOLDERS,
  TIME_WINDOWS,
} from './lib/constants'
import { createGridTaskIds, markTasksShown } from './lib/shuffle'
import { loadAppState, saveAppState } from './lib/storage'
import type {
  AppState,
  ContextFilter,
  EffortFilter,
  Task,
  TimeWindowFilter,
} from './types/app'

const initialState = loadAppState()
const initialGridTaskIds = createGridTaskIds(initialState)

function getProject(state: AppState, task: Task) {
  return state.projects.find((project) => project.id === task.projectId)
}

function getEffortLabel(effortSize: EffortFilter) {
  return EFFORT_OPTIONS.find((option) => option.id === effortSize)?.label
}

function getContextLabel(contextFilter: ContextFilter) {
  if (contextFilter === 'all') {
    return 'All Projects'
  }

  return CONTEXTS.find((context) => context.id === contextFilter)?.name
}

function getTimeWindowLabel(timeWindow: TimeWindowFilter) {
  return timeWindow === 'any' ? 'any duration' : `${timeWindow} minutes`
}

function getGridState(state: AppState) {
  const gridTaskIds = createGridTaskIds(state)

  return {
    state: markTasksShown(state, gridTaskIds),
    gridTaskIds,
  }
}

function App() {
  const [appState, setAppState] = useState<AppState>(() =>
    markTasksShown(initialState, initialGridTaskIds),
  )
  const [gridTaskIds, setGridTaskIds] = useState<string[]>(initialGridTaskIds)

  const { selectedContextId, selectedEffortSize, selectedTimeWindow } =
    appState.preferences

  useEffect(() => {
    saveAppState(appState)
  }, [appState])

  const selectedContextLabel = getContextLabel(selectedContextId)
  const selectedProjects = appState.projects.filter(
    (project) =>
      !project.archived &&
      (selectedContextId === 'all' || project.contextId === selectedContextId),
  )
  const gridTasks = useMemo(
    () =>
      gridTaskIds
        .map((taskId) => appState.tasks.find((task) => task.id === taskId))
        .filter((task): task is Task => Boolean(task)),
    [appState.tasks, gridTaskIds],
  )
  const placeholderCount = Math.max(0, 9 - gridTasks.length)

  function updatePreference(
    preference:
      | { key: 'selectedContextId'; value: ContextFilter }
      | { key: 'selectedEffortSize'; value: EffortFilter }
      | { key: 'selectedTimeWindow'; value: TimeWindowFilter },
  ) {
    setAppState((currentState) => {
      const nextState = {
        ...currentState,
        preferences: {
          ...currentState.preferences,
          [preference.key]: preference.value,
        },
      }
      const nextGridState = getGridState(nextState)

      setGridTaskIds(nextGridState.gridTaskIds)

      return nextGridState.state
    })
  }

  function reshuffleTasks() {
    setAppState((currentState) => {
      const nextGridState = getGridState(currentState)

      setGridTaskIds(nextGridState.gridTaskIds)

      return nextGridState.state
    })
  }

  function resetFilters() {
    setAppState((currentState) => {
      const nextState = {
        ...currentState,
        preferences: DEFAULT_PREFERENCES,
      }
      const nextGridState = getGridState(nextState)

      setGridTaskIds(nextGridState.gridTaskIds)

      return nextGridState.state
    })
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">DriftTime</p>
          <h1>Here's what you could do.</h1>
        </div>
        <div className="top-actions">
          <button className="reset-button" onClick={resetFilters} type="button">
            Reset
          </button>
          <button
            className="shuffle-button"
            onClick={reshuffleTasks}
            type="button"
          >
            Reshuffle
          </button>
        </div>
      </header>

      <section className="controls" aria-label="Task filters">
        <div className="control-group" aria-label="Context">
          <button
            aria-pressed={selectedContextId === 'all'}
            className={
              selectedContextId === 'all'
                ? 'context-pill active'
                : 'context-pill'
            }
            onClick={() =>
              updatePreference({
                key: 'selectedContextId',
                value: 'all',
              })
            }
            type="button"
          >
            <span aria-hidden="true">All</span>
            All Projects
          </button>

          {CONTEXTS.map((context) => (
            <button
              aria-pressed={context.id === selectedContextId}
              className={
                context.id === selectedContextId
                  ? 'context-pill active'
                  : 'context-pill'
              }
              key={context.id}
              onClick={() =>
                updatePreference({
                  key: 'selectedContextId',
                  value: context.id,
                })
              }
              type="button"
            >
              <span aria-hidden="true">{context.icon}</span>
              {context.name}
            </button>
          ))}
        </div>

        <div className="quick-controls">
          <div className="select-card">
            <label htmlFor="effort-size">Effort</label>
            <select
              id="effort-size"
              onChange={(event) =>
                updatePreference({
                  key: 'selectedEffortSize',
                  value: event.target.value as EffortFilter,
                })
              }
              value={selectedEffortSize}
            >
              {EFFORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="select-card">
            <label htmlFor="time-window">Time</label>
            <select
              id="time-window"
              onChange={(event) => {
                const selectedValue = event.target.value

                updatePreference({
                  key: 'selectedTimeWindow',
                  value:
                    selectedValue === 'any' ? 'any' : Number(selectedValue),
                })
              }}
              value={selectedTimeWindow}
            >
              <option value="any">Any Duration</option>
              {TIME_WINDOWS.map((timeWindow) => (
                <option key={timeWindow} value={timeWindow}>
                  {timeWindow} minutes
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="workspace">
        <aside className="sidebar" aria-label="Projects">
          <div className="sidebar-heading">
            <span>{selectedContextLabel}</span>
            <button type="button">Add project</button>
          </div>

          <div className="project-list">
            {selectedProjects.map((project) => (
              <article className="project-row" key={project.id}>
                <span
                  className="project-swatch"
                  style={{ backgroundColor: project.color }}
                  aria-hidden="true"
                />
                <div>
                  <h2>{project.name}</h2>
                  <p>
                    {
                      appState.tasks.filter(
                        (task) => !task.archived && task.projectId === project.id,
                      ).length
                    }{' '}
                    active tasks
                  </p>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="grid-panel" aria-label="Task grid">
          <div className="grid-heading">
            <div>
              <p className="eyebrow">Today</p>
              <h2>{getEffortLabel(selectedEffortSize)} tasks that fit now</h2>
            </div>
            <p>
              Showing {selectedContextLabel?.toLowerCase()} tasks for{' '}
              {getEffortLabel(selectedEffortSize)?.toLowerCase()} and{' '}
              {getTimeWindowLabel(selectedTimeWindow)}.
            </p>
          </div>

          <div className="task-grid">
            {gridTasks.map((task) => {
              const project = getProject(appState, task)

              return (
                <article
                  className="task-card"
                  key={task.id}
                  style={{ borderTopColor: project?.color }}
                >
                  <div>
                    <p className="task-project">{project?.name}</p>
                    <h3>{task.title}</h3>
                  </div>
                  <footer>
                    <span>{task.durationMinutes} min</span>
                    <span>{task.effortSize} bite</span>
                  </footer>
                </article>
              )
            })}

            {PLACEHOLDERS.slice(0, placeholderCount).map((placeholder) => (
              <article className="task-card placeholder-card" key={placeholder}>
                <div>
                  <p className="task-project">Gentle option</p>
                  <h3>{placeholder}</h3>
                </div>
                <footer>
                  <span>Any time</span>
                  <span>optional</span>
                </footer>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
