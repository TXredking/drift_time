import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { version } from '../package.json'
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
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectFormState | null>(null)
  const [taskForm, setTaskForm] = useState<TaskFormState | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

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
  const activeProject = activeProjectId
    ? (appState.projects.find((p) => p.id === activeProjectId) ?? null)
    : null
  const activeProjectTasks = activeProject
    ? appState.tasks.filter(
        (task) => !task.archived && task.projectId === activeProject.id,
      )
    : []
  const gridTasks = useMemo(
    () =>
      gridTaskIds
        .map((taskId) => appState.tasks.find((task) => task.id === taskId))
        .filter((task): task is Task => Boolean(task)),
    [appState.tasks, gridTaskIds],
  )
  const placeholderCount = Math.max(0, 9 - gridTasks.length)
  const activeTask = activeTaskId
    ? (appState.tasks.find((task) => task.id === activeTaskId) ?? null)
    : null
  const activeTaskProject = activeTask ? getProject(appState, activeTask) : null

  function openTaskModal(taskId: string) {
    setActiveTaskId(taskId)
    setTaskForm(null)
  }

  function closeTaskModal() {
    setActiveTaskId(null)
    setTaskForm(null)
  }

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

  function toggleSidebar() {
    setAppState((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        sidebarCollapsed: !current.preferences.sidebarCollapsed,
      },
    }))
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
    setActiveProjectId(projectForm.id ?? newProjectId)
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
    setActiveProjectId(null)
    setProjectForm(null)
    setTaskForm(null)
  }

  function openAddTaskForm() {
    if (!activeProjectId) {
      return
    }

    setTaskForm(getTaskFormState(undefined, activeProjectId))
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
    closeTaskModal()
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
    closeTaskModal()
  }

  return (
    <Tooltip.Provider delayDuration={400}>
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

      <section
        className={
          appState.preferences.sidebarCollapsed
            ? 'workspace sidebar-collapsed'
            : 'workspace'
        }
      >
        <aside
          className={
            appState.preferences.sidebarCollapsed ? 'sidebar collapsed' : 'sidebar'
          }
          aria-label="Projects"
        >
          <div className="sidebar-heading">
            {!appState.preferences.sidebarCollapsed && (
              <span>{selectedContextLabel}</span>
            )}
            <div className="sidebar-heading-actions">
              {!appState.preferences.sidebarCollapsed && (
                <button onClick={openAddProjectForm} type="button">
                  Add project
                </button>
              )}
              <button
                aria-label={
                  appState.preferences.sidebarCollapsed
                    ? 'Expand sidebar'
                    : 'Collapse sidebar'
                }
                className="sidebar-toggle"
                onClick={toggleSidebar}
                type="button"
              >
                {appState.preferences.sidebarCollapsed ? '›' : '‹'}
              </button>
            </div>
          </div>

          {!appState.preferences.sidebarCollapsed && projectForm && !projectForm.id ? (
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

          {!appState.preferences.sidebarCollapsed && <div className="project-list">
            {selectedProjects.map((project) => (
              <article className="project-row" key={project.id}>
                <button
                  className="project-select"
                  onClick={() => setActiveProjectId(project.id)}
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
              </article>
            ))}
          </div>}
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
                  <button
                    className="task-card-body"
                    onClick={() => openTaskModal(task.id)}
                    type="button"
                  >
                    <div>
                      <p className="task-project">{project?.name}</p>
                      <h3>{task.title}</h3>
                    </div>
                    <div className="task-meta">
                      <span>{task.durationMinutes} min</span>
                      <span>{task.effortSize} bite</span>
                    </div>
                  </button>
                </article>
              )
            })}

            {PLACEHOLDERS.slice(0, placeholderCount).map((placeholder) => (
              <article className="task-card placeholder-card" key={placeholder}>
                <p className="task-project">Gentle option</p>
                <h3>{placeholder}</h3>
                <div className="task-meta">
                  <span>Any time</span>
                  <span>optional</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
      <footer className="app-footer">
        <span>v{version}</span>
      </footer>

      <Dialog.Root
        open={activeTask !== null}
        onOpenChange={(open) => { if (!open) closeTaskModal() }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal">
            <div className="modal-header">
              <div
                className="modal-color-stripe"
                style={{ backgroundColor: activeTaskProject?.color }}
                aria-hidden="true"
              />
              <p className="task-project">{activeTaskProject?.name}</p>
              <Dialog.Close asChild>
                <button aria-label="Close" className="modal-close" type="button">
                  ✕
                </button>
              </Dialog.Close>
            </div>

            {activeTask && taskForm?.id === activeTask.id ? (
              <>
                <Dialog.Title className="sr-only">Edit task</Dialog.Title>
                <form className="editor-form wide" onSubmit={saveTask}>
                  <label>
                    Task title
                    <input
                      onChange={(event) =>
                        setTaskForm({ ...taskForm, title: event.target.value })
                      }
                      value={taskForm.title}
                    />
                  </label>

                  <label>
                    Notes
                    <textarea
                      onChange={(event) =>
                        setTaskForm({ ...taskForm, notes: event.target.value })
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
                          setTaskForm({ ...taskForm, projectId: event.target.value })
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
                    <button type="submit">Save task</button>
                    <button onClick={() => setTaskForm(null)} type="button">
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : activeTask ? (
              <>
                <div className="modal-body">
                  <Dialog.Title className="modal-task-title">
                    {activeTask.title}
                  </Dialog.Title>
                  {activeTask.notes && (
                    <p className="task-notes">{activeTask.notes}</p>
                  )}
                  <p className="task-meta">
                    <span>{activeTask.durationMinutes} min</span>
                    <span>{activeTask.effortSize} bite</span>
                  </p>
                </div>

                <div className="modal-actions">
                  <button
                    onClick={() =>
                      setTaskForm(getTaskFormState(activeTask, activeTask.projectId))
                    }
                    type="button"
                  >
                    Edit
                  </button>
                  <button onClick={() => completeTask(activeTask.id)} type="button">
                    Done
                  </button>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={() => archiveTask(activeTask.id)}
                        type="button"
                      >
                        Archive
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="tooltip-content" sideOffset={6}>
                        Archive removes this task from your active list without
                        marking it complete.
                        <Tooltip.Arrow className="tooltip-arrow" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={activeProject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveProjectId(null)
            setProjectForm(null)
            setTaskForm(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal project-modal">
            <div className="modal-header">
              <span
                className="project-swatch"
                style={{ backgroundColor: activeProject?.color }}
                aria-hidden="true"
              />
              <Dialog.Title className="modal-title">
                {activeProject?.name}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button aria-label="Close" className="modal-close" type="button">
                  ✕
                </button>
              </Dialog.Close>
            </div>

            {activeProject && projectForm?.id === activeProject.id ? (
              <form className="editor-form wide" onSubmit={saveProject}>
                <label>
                  Project name
                  <input
                    onChange={(event) =>
                      setProjectForm({ ...projectForm, name: event.target.value })
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
                        className={projectForm.color === color ? 'color-dot active' : 'color-dot'}
                        key={color}
                        onClick={() => setProjectForm({ ...projectForm, color })}
                        style={{ backgroundColor: color }}
                        type="button"
                      />
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit">Save project</button>
                  <button onClick={() => setProjectForm(null)} type="button">
                    Cancel
                  </button>
                </div>
              </form>
            ) : activeProject ? (
              <div className="modal-body">
                <div className="project-modal-actions">
                  <button
                    onClick={() => setProjectForm(getProjectFormState(activeProject))}
                    type="button"
                  >
                    Edit project
                  </button>
                  <button onClick={() => archiveProject(activeProject.id)} type="button">
                    Archive project
                  </button>
                </div>
              </div>
            ) : null}

            <section className="project-modal-tasks">
              <div className="project-modal-tasks-heading">
                <h3>Tasks</h3>
                <button onClick={openAddTaskForm} type="button">
                  Add task
                </button>
              </div>

              {taskForm && !taskForm.id ? (
                <form className="editor-form" onSubmit={saveTask}>
                  <label>
                    Task title
                    <input
                      onChange={(event) =>
                        setTaskForm({ ...taskForm, title: event.target.value })
                      }
                      value={taskForm.title}
                    />
                  </label>

                  <label>
                    Notes
                    <textarea
                      onChange={(event) =>
                        setTaskForm({ ...taskForm, notes: event.target.value })
                      }
                      rows={2}
                      value={taskForm.notes}
                    />
                  </label>

                  <div className="form-grid">
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
                    <button type="submit">Create task</button>
                    <button onClick={() => setTaskForm(null)} type="button">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              {activeProjectTasks.length > 0 ? (
                <div className="task-list">
                  {activeProjectTasks.map((task) => (
                    <article className="task-row" key={task.id}>
                      <button
                        className="task-row-select"
                        onClick={() => openTaskModal(task.id)}
                        type="button"
                      >
                        <h3>{task.title}</h3>
                        <p>
                          {task.durationMinutes} min · {task.effortSize} bite
                        </p>
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-note">No active tasks. Add one above.</p>
              )}
            </section>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
    </Tooltip.Provider>
  )
}

export default App
