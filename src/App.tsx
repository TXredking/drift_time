import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'
import { CONTEXTS } from './data/contexts'
import {
  DEFAULT_PREFERENCES,
  EFFORT_OPTIONS,
  PLACEHOLDERS,
  TIME_WINDOWS,
} from './lib/constants'
import { createId } from './lib/ids'
import { createGridTaskIds, markTasksShown } from './lib/shuffle'
import { loadAppState, saveAppState } from './lib/storage'
import type {
  AppState,
  ContextId,
  ContextFilter,
  EffortSize,
  EffortFilter,
  Project,
  Task,
  TimeWindowFilter,
} from './types/app'

const initialState = loadAppState()
const initialGridTaskIds = createGridTaskIds(initialState)
const PROJECT_COLORS = [
  '#2f7d68',
  '#a84f3f',
  '#3b6ea8',
  '#7a5a31',
  '#557c3d',
  '#b1682d',
]

type ProjectFormState = {
  id?: string
  name: string
  contextId: ContextId
  color: string
}

type TaskFormState = {
  id?: string
  title: string
  notes: string
  projectId: string
  durationMinutes: number
  effortSize: EffortSize
}

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

function getProjectFormState(project?: Project): ProjectFormState {
  return {
    id: project?.id,
    name: project?.name ?? '',
    contextId: project?.contextId ?? 'home',
    color: project?.color ?? PROJECT_COLORS[0],
  }
}

function getTaskFormState(task?: Task, projectId = ''): TaskFormState {
  return {
    id: task?.id,
    title: task?.title ?? '',
    notes: task?.notes ?? '',
    projectId: task?.projectId ?? projectId,
    durationMinutes: task?.durationMinutes ?? 15,
    effortSize: task?.effortSize ?? 'small',
  }
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  )
  const [projectForm, setProjectForm] = useState<ProjectFormState | null>(null)
  const [taskForm, setTaskForm] = useState<TaskFormState | null>(null)

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
  const selectedProject =
    selectedProjects.find((project) => project.id === selectedProjectId) ??
    selectedProjects[0]
  const selectedProjectTasks = selectedProject
    ? appState.tasks.filter(
        (task) => !task.archived && task.projectId === selectedProject.id,
      )
    : []
  const archivedTasks = appState.tasks.filter((task) => task.archived)
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

  function commitAppState(nextState: AppState) {
    const nextGridState = getGridState(nextState)

    setGridTaskIds(nextGridState.gridTaskIds)
    setAppState(nextGridState.state)
  }

  function openAddProjectForm() {
    setProjectForm({
      ...getProjectFormState(),
      contextId: selectedContextId === 'all' ? 'home' : selectedContextId,
    })
  }

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!projectForm?.name.trim()) {
      return
    }

    const now = new Date().toISOString()
    const newProjectId = createId('project')
    const projectName = projectForm.name.trim()
    const nextProjects = projectForm.id
      ? appState.projects.map((project) =>
          project.id === projectForm.id
            ? {
                ...project,
                name: projectName,
                contextId: projectForm.contextId,
                color: projectForm.color,
              }
            : project,
        )
      : [
          ...appState.projects,
          {
            id: newProjectId,
            name: projectName,
            contextId: projectForm.contextId,
            color: projectForm.color,
            archived: false,
            createdAt: now,
          },
        ]

    commitAppState({ ...appState, projects: nextProjects })
    setSelectedProjectId(projectForm.id ?? newProjectId)
    setProjectForm(null)
  }

  function archiveProject(projectId: string) {
    const nextState = {
      ...appState,
      projects: appState.projects.map((project) =>
        project.id === projectId ? { ...project, archived: true } : project,
      ),
      preferences: {
        ...appState.preferences,
        pinnedTaskIds: appState.preferences.pinnedTaskIds.filter(
          (taskId) =>
            appState.tasks.find((task) => task.id === taskId)?.projectId !==
            projectId,
        ),
      },
    }

    commitAppState(nextState)
    setSelectedProjectId((currentProjectId) =>
      currentProjectId === projectId ? null : currentProjectId,
    )
    setProjectForm(null)
    setTaskForm(null)
  }

  function openAddTaskForm() {
    if (!selectedProject) {
      return
    }

    setTaskForm(getTaskFormState(undefined, selectedProject.id))
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!taskForm?.title.trim() || !taskForm.projectId) {
      return
    }

    const now = new Date().toISOString()
    const taskTitle = taskForm.title.trim()
    const nextTasks = taskForm.id
      ? appState.tasks.map((task) =>
          task.id === taskForm.id
            ? {
                ...task,
                title: taskTitle,
                notes: taskForm.notes.trim(),
                projectId: taskForm.projectId,
                durationMinutes: taskForm.durationMinutes,
                effortSize: taskForm.effortSize,
              }
            : task,
        )
      : [
          ...appState.tasks,
          {
            id: createId('task'),
            title: taskTitle,
            notes: taskForm.notes.trim(),
            projectId: taskForm.projectId,
            durationMinutes: taskForm.durationMinutes,
            effortSize: taskForm.effortSize,
            archived: false,
            completedAt: null,
            createdAt: now,
            lastShownAt: null,
          },
        ]

    commitAppState({ ...appState, tasks: nextTasks })
    setSelectedProjectId(taskForm.projectId)
    setTaskForm(null)
  }

  function completeTask(taskId: string) {
    const completedAt = new Date().toISOString()
    const nextState = {
      ...appState,
      tasks: appState.tasks.map((task) =>
        task.id === taskId
          ? { ...task, archived: true, completedAt }
          : task,
      ),
      preferences: {
        ...appState.preferences,
        pinnedTaskIds: appState.preferences.pinnedTaskIds.filter(
          (pinnedTaskId) => pinnedTaskId !== taskId,
        ),
      },
    }

    commitAppState(nextState)
    setTaskForm((currentTaskForm) =>
      currentTaskForm?.id === taskId ? null : currentTaskForm,
    )
  }

  function archiveTask(taskId: string) {
    const nextState = {
      ...appState,
      tasks: appState.tasks.map((task) =>
        task.id === taskId
          ? { ...task, archived: true, completedAt: task.completedAt ?? null }
          : task,
      ),
      preferences: {
        ...appState.preferences,
        pinnedTaskIds: appState.preferences.pinnedTaskIds.filter(
          (pinnedTaskId) => pinnedTaskId !== taskId,
        ),
      },
    }

    commitAppState(nextState)
    setTaskForm((currentTaskForm) =>
      currentTaskForm?.id === taskId ? null : currentTaskForm,
    )
  }

  function restoreTask(taskId: string) {
    const taskToRestore = appState.tasks.find((task) => task.id === taskId)

    if (!taskToRestore) {
      return
    }

    const nextState = {
      ...appState,
      tasks: appState.tasks.map((task) =>
        task.id === taskId
          ? { ...task, archived: false, completedAt: null }
          : task,
      ),
    }

    commitAppState(nextState)
    setSelectedProjectId(taskToRestore.projectId)
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
            <button onClick={openAddProjectForm} type="button">
              Add project
            </button>
          </div>

          {projectForm ? (
            <form className="editor-form" onSubmit={saveProject}>
              <label>
                Project name
                <input
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      name: event.target.value,
                    })
                  }
                  value={projectForm.name}
                />
              </label>

              <label>
                Context
                <select
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      contextId: event.target.value as ContextId,
                    })
                  }
                  value={projectForm.contextId}
                >
                  {CONTEXTS.map((context) => (
                    <option key={context.id} value={context.id}>
                      {context.name}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="field-label">Color</span>
                <div className="color-options">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      aria-label={`Use color ${color}`}
                      aria-pressed={projectForm.color === color}
                      className={
                        projectForm.color === color
                          ? 'color-dot active'
                          : 'color-dot'
                      }
                      key={color}
                      onClick={() =>
                        setProjectForm({
                          ...projectForm,
                          color,
                        })
                      }
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">
                  {projectForm.id ? 'Save project' : 'Create project'}
                </button>
                <button onClick={() => setProjectForm(null)} type="button">
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="project-list">
            {selectedProjects.map((project) => (
              <article
                className={
                  project.id === selectedProject?.id
                    ? 'project-row active'
                    : 'project-row'
                }
                key={project.id}
              >
                <button
                  className="project-select"
                  onClick={() => setSelectedProjectId(project.id)}
                  type="button"
                >
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
                          (task) =>
                            !task.archived && task.projectId === project.id,
                        ).length
                      }{' '}
                      active tasks
                    </p>
                  </div>
                </button>
                <div className="row-actions">
                  <button
                    onClick={() => setProjectForm(getProjectFormState(project))}
                    type="button"
                  >
                    Edit
                  </button>
                  <button onClick={() => archiveProject(project.id)} type="button">
                    Archive
                  </button>
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
                    <div className="task-meta">
                      <span>{task.durationMinutes} min</span>
                      <span>{task.effortSize} bite</span>
                    </div>
                    <button onClick={() => completeTask(task.id)} type="button">
                      Done
                    </button>
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
                  <div className="task-meta">
                    <span>Any time</span>
                    <span>optional</span>
                  </div>
                </footer>
              </article>
            ))}
          </div>

          <section className="task-manager" aria-label="Project tasks">
            <div className="task-manager-heading">
              <div>
                <p className="eyebrow">Manage</p>
                <h2>{selectedProject?.name ?? 'Choose a project'}</h2>
              </div>
              <button
                disabled={!selectedProject}
                onClick={openAddTaskForm}
                type="button"
              >
                Add task
              </button>
            </div>

            {taskForm ? (
              <form className="editor-form wide" onSubmit={saveTask}>
                <label>
                  Task title
                  <input
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        title: event.target.value,
                      })
                    }
                    value={taskForm.title}
                  />
                </label>

                <label>
                  Notes
                  <textarea
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        notes: event.target.value,
                      })
                    }
                    rows={3}
                    value={taskForm.notes}
                  />
                </label>

                <div className="form-grid">
                  <label>
                    Project
                    <select
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          projectId: event.target.value,
                        })
                      }
                      value={taskForm.projectId}
                    >
                      {appState.projects
                        .filter((project) => !project.archived)
                        .map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label>
                    Duration
                    <select
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          durationMinutes: Number(event.target.value),
                        })
                      }
                      value={taskForm.durationMinutes}
                    >
                      {TIME_WINDOWS.map((timeWindow) => (
                        <option key={timeWindow} value={timeWindow}>
                          {timeWindow} minutes
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Effort
                    <select
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          effortSize: event.target.value as EffortSize,
                        })
                      }
                      value={taskForm.effortSize}
                    >
                      {EFFORT_OPTIONS.filter((option) => option.id !== 'any').map(
                        (option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit">
                    {taskForm.id ? 'Save task' : 'Create task'}
                  </button>
                  <button onClick={() => setTaskForm(null)} type="button">
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <div className="task-list">
              {selectedProjectTasks.map((task) => (
                <article className="task-row" key={task.id}>
                  <div>
                    <h3>{task.title}</h3>
                    <p>
                      {task.durationMinutes} min · {task.effortSize} bite
                    </p>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => completeTask(task.id)} type="button">
                      Done
                    </button>
                    <button
                      onClick={() =>
                        setTaskForm(getTaskFormState(task, task.projectId))
                      }
                      type="button"
                    >
                      Edit
                    </button>
                    <button onClick={() => archiveTask(task.id)} type="button">
                      Archive
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <section className="archive-panel" aria-label="Archived tasks">
              <div className="archive-heading">
                <div>
                  <p className="eyebrow">Archive</p>
                  <h2>Done for now</h2>
                </div>
                <span>{archivedTasks.length} saved</span>
              </div>

              {archivedTasks.length > 0 ? (
                <div className="archive-list">
                  {archivedTasks.map((task) => {
                    const project = getProject(appState, task)

                    return (
                      <article className="archive-row" key={task.id}>
                        <div>
                          <h3>{task.title}</h3>
                          <p>
                            {project?.name ?? 'No project'} ·{' '}
                            {task.completedAt ? 'completed' : 'archived'}
                          </p>
                        </div>
                        <button onClick={() => restoreTask(task.id)} type="button">
                          Restore
                        </button>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p className="empty-note">Completed and archived tasks will land here.</p>
              )}
            </section>
          </section>
        </section>
      </section>
    </main>
  )
}

export default App
