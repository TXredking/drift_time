# M4-02 — Task Card Modal

**Milestone:** 4  
**PR:** 2 of 3  
**Scope:** Medium — new state, modal JSX, card markup change, modal CSS

## Goal

Clicking a task card in the grid opens a modal. The modal shows full task details in read mode. An Edit button switches to edit mode (inline form). Done and Archive buttons act on the task and close the modal. The Done button currently sitting on each card moves into the modal — cards become tap targets only.

This task should be completed before M4-03 (project modal) because the project modal's task list will reuse the same open pattern.

## Files changed

- `src/App.tsx`
- `src/App.css`

---

## Implementation

### `src/App.tsx` — state

Add one new piece of state after the existing `taskForm` state:

```ts
const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
```

Derive the active task from it:

```ts
const activeTask = activeTaskId
  ? appState.tasks.find((task) => task.id === activeTaskId) ?? null
  : null
const activeTaskProject = activeTask ? getProject(appState, activeTask) : null
```

### `src/App.tsx` — open/close helpers

```ts
function openTaskModal(taskId: string) {
  setActiveTaskId(taskId)
  setTaskForm(null)
}

function closeTaskModal() {
  setActiveTaskId(null)
  setTaskForm(null)
}
```

### `src/App.tsx` — modify `completeTask` and `archiveTask`

Both functions currently call `setTaskForm` to close the form. They should also close the modal:

```ts
function completeTask(taskId: string) {
  const completedAt = new Date().toISOString()
  const nextState = {
    ...appState,
    tasks: appState.tasks.map((task) =>
      task.id === taskId ? { ...task, archived: true, completedAt } : task,
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
```

### `src/App.tsx` — task card markup

Remove the Done button from the card footer. Make the whole card clickable:

```tsx
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
        <footer className="task-meta">
          <span>{task.durationMinutes} min</span>
          <span>{task.effortSize} bite</span>
        </footer>
      </button>
    </article>
  )
})}
```

### `src/App.tsx` — modal JSX

Add the modal at the bottom of the return, just before the closing `</main>`. It renders only when `activeTask` is set:

```tsx
{activeTask && (
  <div
    className="modal-overlay"
    onClick={(event) => {
      if (event.target === event.currentTarget) closeTaskModal()
    }}
  >
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <div className="modal-header">
        <div
          className="modal-color-stripe"
          style={{ backgroundColor: activeTaskProject?.color }}
          aria-hidden="true"
        />
        <p className="task-project">{activeTaskProject?.name}</p>
        <button
          aria-label="Close"
          className="modal-close"
          onClick={closeTaskModal}
          type="button"
        >
          ✕
        </button>
      </div>

      {taskForm?.id === activeTask.id ? (
        /* Edit mode */
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
      ) : (
        /* Read mode */
        <>
          <div className="modal-body">
            <h2 id="task-modal-title">{activeTask.title}</h2>
            {activeTask.notes && <p className="task-notes">{activeTask.notes}</p>}
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
            <button
              onClick={() => archiveTask(activeTask.id)}
              title="Archive removes this task from your active list without marking it complete."
              type="button"
            >
              Archive
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
```

### `src/App.css`

```css
/* Task card as a click target */
.task-card-body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 0;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

@media (prefers-reduced-motion: no-preference) {
  .modal-overlay {
    animation: fade-in 0.1s ease;
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal {
  background: var(--surface);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: min(480px, 90vw);
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1rem 0;
}

.modal-color-stripe {
  width: 4px;
  height: 1.25rem;
  border-radius: 2px;
  flex-shrink: 0;
}

.modal-header .task-project {
  flex: 1;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  color: inherit;
  opacity: 0.6;
}

.modal-close:hover {
  opacity: 1;
}

.modal-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-body h2 {
  margin: 0;
  font-size: 1.2rem;
}

.task-notes {
  color: var(--text-secondary);
  white-space: pre-wrap;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
}
```

---

## Acceptance

- Clicking a task card in the grid opens the modal.
- Modal shows title, notes (if any), project name, duration, effort.
- Edit button switches to edit mode; form fields are pre-filled.
- Saving the edit form returns to read mode with updated values.
- Done button archives the task with a completion timestamp, closes the modal, and removes the task from the grid.
- Archive button archives the task without a completion timestamp, closes the modal, and removes the task from the grid.
- Archive button has a `title` tooltip explaining the distinction.
- Clicking the overlay backdrop closes the modal.
- No Done button remains on the task card itself.
