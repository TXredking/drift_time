# M4-01 — Collapsible Sidebar

**Milestone:** 4  
**PR:** 1 of 3  
**Scope:** Small — type update, one new function, sidebar markup, CSS

## Goal

Add a toggle button to the project sidebar that collapses it to a narrow strip. Collapsed state is stored in `Preferences` so it survives a browser refresh. Collapsing has no effect on context, filters, or the grid.

## Files changed

- `src/types/app.ts`
- `src/lib/constants.ts`
- `src/App.tsx`
- `src/App.css`

---

## Implementation

### `src/types/app.ts`

Add `sidebarCollapsed` to `Preferences`:

```ts
export type Preferences = {
  selectedContextId: ContextFilter
  selectedEffortSize: EffortFilter
  selectedTimeWindow: TimeWindowFilter
  pinnedTaskIds: string[]
  sidebarCollapsed: boolean
}
```

### `src/lib/constants.ts`

Add the field to `DEFAULT_PREFERENCES`:

```ts
export const DEFAULT_PREFERENCES: Preferences = {
  selectedContextId: 'all',
  selectedEffortSize: 'any',
  selectedTimeWindow: 'any',
  pinnedTaskIds: [],
  sidebarCollapsed: false,
}
```

### `src/App.tsx`

Add `toggleSidebar` near the other state-update functions:

```ts
function toggleSidebar() {
  setAppState((current) => ({
    ...current,
    preferences: {
      ...current.preferences,
      sidebarCollapsed: !current.preferences.sidebarCollapsed,
    },
  }))
}
```

Update the `<aside>` element. Apply the collapsed class, split the heading actions into a wrapper so the toggle button can sit alongside the Add button, and hide non-toggle content via class when collapsed:

```tsx
<aside
  className={appState.preferences.sidebarCollapsed ? 'sidebar collapsed' : 'sidebar'}
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

  {!appState.preferences.sidebarCollapsed && (
    <>
      {projectForm ? (
        <form className="editor-form" onSubmit={saveProject}>
          {/* existing project form unchanged */}
        </form>
      ) : null}

      <div className="project-list">
        {/* existing project list unchanged */}
      </div>
    </>
  )}
</aside>
```

### `src/App.css`

```css
.sidebar {
  /* existing styles — add transition */
  transition: width 0.15s ease;
}

.sidebar.collapsed {
  width: 2.75rem;
  min-width: 2.75rem;
  overflow: hidden;
}

.sidebar-heading-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.sidebar-toggle {
  padding: 0.25rem 0.5rem;
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  color: inherit;
}

.sidebar-toggle:hover {
  border-color: currentColor;
}
```

---

## Acceptance

- Toggle button is always visible in the sidebar header.
- Clicking collapses the sidebar; only the toggle button remains.
- Clicking again restores the full sidebar.
- Refreshing the browser preserves collapsed/expanded state.
- Collapsing has no effect on context selection, filters, or the grid.
