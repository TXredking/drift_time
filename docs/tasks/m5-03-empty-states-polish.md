# M5-03 — Empty States & Polish

**Milestone:** 5  
**PR:** 3 of 3  
**Scope:** Small — conditional UI additions, copy changes, CSS tweaks

## Goal

Surface helpful messages when the user has no matching tasks or no projects in the current context. Tighten microcopy throughout so the app feels considered rather than functional-only. Update plan.md to mark M5 complete.

## Files changed

- `src/App.tsx`
- `src/App.css`
- `docs/plan.md`

---

## Implementation

### Empty grid state

Currently, when no tasks match the filters, the grid shows nine placeholder cards and no explanation. Add a message above the grid when `gridTasks.length === 0`.

In `src/App.tsx`, inside `<section className="grid-panel">`, add above `<div className="task-grid">`:

```tsx
{gridTasks.length === 0 && (
  <p className="empty-grid-message">
    No tasks match your current filters.{' '}
    <button className="inline-link" onClick={resetFilters} type="button">
      Reset filters
    </button>{' '}
    or add tasks to a project.
  </p>
)}
```

### Empty sidebar state

When `selectedProjects.length === 0` and the sidebar is not collapsed, show a short message in the project list:

```tsx
{!appState.preferences.sidebarCollapsed && (
  <div className="project-list">
    {selectedProjects.length === 0 ? (
      <p className="empty-note">
        No projects here yet.{' '}
        <button className="inline-link" onClick={openAddProjectForm} type="button">
          Add one.
        </button>
      </p>
    ) : (
      selectedProjects.map((project) => (
        /* existing project row JSX unchanged */
      ))
    )}
  </div>
)}
```

### Microcopy updates

Make these targeted copy changes in `src/App.tsx`:

| Location | Old | New |
|---|---|---|
| Reshuffle button | `Reshuffle` | `Shuffle` |
| Grid heading `<h2>` | `{getEffortLabel(selectedEffortSize)} tasks that fit now` | `What you could do now` |
| Grid subline | `Showing … tasks for … and …` | `{selectedContextLabel} · {getEffortLabel(selectedEffortSize)} · {getTimeWindowLabel(selectedTimeWindow)}` |
| `openAddTaskForm` called when no activeProjectId | (silently does nothing) | no change needed — button is only shown inside project modal |

The grid heading change removes the double-restatement of filters (already shown in the controls) and makes the heading evergreen.

### `src/App.css`

```css
.empty-grid-message {
  color: var(--muted);
  font-size: 0.9rem;
  margin: 0 0 16px;
}

.inline-link {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-decoration: underline;
}

.inline-link:hover {
  opacity: 0.7;
}
```

### `docs/plan.md`

Update milestone status markers:

- Change `### Milestone 4: Modal-First UX and Sidebar Collapse [CURRENT]` → `[DONE]`
- Change `### Milestone 5: Export, Import, and Polish` → `### Milestone 5: Export, Import, and Polish [DONE]`

---

## Acceptance

- When no tasks match the current filters, a message appears above the grid with a "Reset filters" inline button.
- Clicking "Reset filters" from the empty-state message resets preferences and regenerates the grid.
- When the selected context has no active projects and the sidebar is expanded, a short message appears with an "Add one" link.
- The Reshuffle button label reads "Shuffle".
- The grid heading is `What you could do now` regardless of filter state.
- `plan.md` shows both M4 and M5 as `[DONE]`.
