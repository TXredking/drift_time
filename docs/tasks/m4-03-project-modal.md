# M4-03 — Project Modal

**Milestone:** 4  
**PR:** 3 of 3  
**Scope:** Large — replaces inline task manager with a modal, changes project click behavior, removes derived state

**Prerequisite:** M4-02 must be merged first. The project modal's task list opens the task card modal introduced in that task, and `@radix-ui/react-dialog` will already be installed.

## Goal

Clicking a project in the sidebar opens a modal instead of expanding the inline task manager below the grid. The modal contains the project's edit fields, archive button, active task list, and add task button. The entire `.task-manager` section is removed from the grid panel.

**Radix UI:** Uses `@radix-ui/react-dialog` (installed in M4-02) for the modal. Same benefits as the task card modal: focus trap, Escape key, ARIA, body scroll lock.

## Files changed

- `src/App.tsx`
- `src/App.css`

---

## Implementation

### `src/App.tsx` — imports

`@radix-ui/react-dialog` is already installed. Add the import if not already present at the top of the file:

```ts
import * as Dialog from '@radix-ui/react-dialog'
```

### `src/App.tsx` — state changes

Replace `selectedProjectId` with `activeProjectId`. The inline task manager was the only consumer of `selectedProjectId`; it is being removed.

```ts
// Remove:
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

// Add:
const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
```

Remove the derived values that were only used by the inline task manager:

```ts
// Remove these:
const selectedProject =
  selectedProjects.find((project) => project.id === selectedProjectId) ??
  selectedProjects[0]
const selectedProjectTasks = selectedProject
  ? appState.tasks.filter(
      (task) => !task.archived && task.projectId === selectedProject.id,
    )
  : []
```

Add derived values for the project modal:

```ts
const activeProject = activeProjectId
  ? appState.projects.find((project) => project.id === activeProjectId) ?? null
  : null
const activeProjectTasks = activeProject
  ? appState.tasks.filter(
      (task) => !task.archived && task.projectId === activeProject.id,
    )
  : []
```

### `src/App.tsx` — update existing functions

**`saveProject`** — replace `setSelectedProjectId` with `setActiveProjectId` so the project modal stays open after saving:

```ts
function saveProject(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()

  if (!projectForm?.name.trim()) return

  const now = new Date().toISOString()
  const newProjectId = createId('project')
  const projectName = projectForm.name.trim()
  const nextProjects = projectForm.id
    ? appState.projects.map((project) =>
        project.id === projectForm.id
          ? { ...project, name: projectName, contextId: projectForm.contextId, color: projectForm.color }
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
```

**`archiveProject`** — close both modals on archive:

```ts
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
          appState.tasks.find((task) => task.id === taskId)?.projectId !== projectId,
      ),
    },
  }

  commitAppState(nextState)
  setActiveProjectId(null)
  setProjectForm(null)
  setTaskForm(null)
}
```

**`openAddTaskForm`** — use `activeProjectId` instead of `selectedProject`:

```ts
function openAddTaskForm() {
  if (!activeProjectId) return
  setTaskForm(getTaskFormState(undefined, activeProjectId))
}
```

**`saveTask`** — remove the `setSelectedProjectId` call. For new tasks, `taskForm` clears and the project modal stays open via `activeProjectId`. For edits, the task card modal (from M4-02) stays open via `activeTaskId`.

```ts
function saveTask(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()

  if (!taskForm?.title.trim() || !taskForm.projectId) return

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
```

### `src/App.tsx` — sidebar project list

Change click handler to open the modal. Remove `row-actions` (Edit and Archive move into the project modal) and remove the active-row highlight:

```tsx
<div className="project-list">
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
                (task) => !task.archived && task.projectId === project.id,
              ).length
            }{' '}
            active tasks
          </p>
        </div>
      </button>
    </article>
  ))}
</div>
```

### `src/App.tsx` — remove inline task manager

Delete the entire `<section className="task-manager">` block from the grid panel. This block contained the task manager heading, task form, task list, and archive panel. All of this moves into the project modal.

The archive panel (`archivedTasks`) will be addressed in M5 as a standalone accessible view.

### `src/App.tsx` — project modal JSX

Add after the task card modal Dialog (from M4-02), still inside `<Tooltip.Provider>` and `<main>`:

```tsx
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
        /* Edit mode */
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
        /* Read mode */
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
```

### `src/App.css`

The project modal shares `.modal-overlay` and `.modal` styles from M4-02. Add project-modal-specific rules:

```css
.project-modal {
  width: min(560px, 90vw);
}

.modal-title {
  flex: 1;
  margin: 0;
  font-size: 1.1rem;
}

.project-modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.project-modal-tasks {
  border-top: 1px solid var(--border);
  padding: 1rem;
}

.project-modal-tasks-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.project-modal-tasks-heading h3 {
  margin: 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
}

.task-row-select {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0;
  color: inherit;
}

.task-row-select:hover h3 {
  text-decoration: underline;
}
```

---

## Acceptance

- Clicking a project in the sidebar opens the project modal.
- The modal shows the project name and color swatch in the header.
- Edit project button shows the edit form inline in the modal; saving updates the project name, context, and color.
- Archive project button archives the project and closes the modal.
- Active tasks for the project are listed; clicking a task opens the task card modal (from M4-02).
- Add task button shows the new-task form inside the project modal; saving adds the task to the list.
- Pressing Escape closes the project modal.
- Clicking the overlay backdrop closes the project modal.
- Focus is trapped inside the project modal while it is open.
- The inline task manager section below the grid is gone.
- No `project-row active` highlight remains in the sidebar.
