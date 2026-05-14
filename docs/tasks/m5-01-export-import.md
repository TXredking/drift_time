# M5-01 — Export & Import

**Milestone:** 5  
**PR:** 1 of 3  
**Scope:** Medium — two new storage functions, new UI section, file I/O state

## Goal

Let users back up and restore their data. Export serialises the current `AppState` to a JSON file download. Import reads a JSON file, validates it, confirms with the user, then replaces state in-place — no page reload needed. `isAppState` already exists in `storage.ts` and can be used directly for import validation.

## Files changed

- `src/lib/storage.ts`
- `src/App.tsx`
- `src/App.css`

---

## Implementation

### `src/lib/storage.ts`

Add `exportAppState` and `parseImportedAppState`. `isAppState` is already defined in this file and does not need to change.

```ts
export function exportAppState(state: AppState): void {
  const date = new Date().toISOString().slice(0, 10)
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `drifttime-backup-${date}.json`
  document.body.appendChild(anchor)
  anchor.click()
  URL.revokeObjectURL(url)
  anchor.remove()
}

export function parseImportedAppState(json: string): AppState | null {
  try {
    const parsed: unknown = JSON.parse(json)
    return isAppState(parsed) ? parsed : null
  } catch {
    return null
  }
}
```

### `src/App.tsx` — imports

```ts
import { exportAppState, loadAppState, parseImportedAppState, saveAppState } from './lib/storage'
```

### `src/App.tsx` — state

Add two pieces of state near the other UI state:

```ts
const [importError, setImportError] = useState<string | null>(null)
const fileInputRef = useRef<HTMLInputElement>(null)
```

Also add the `useRef` import to the React import line.

### `src/App.tsx` — import handler

Add after the existing state-update functions:

```ts
function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result
    if (typeof result !== 'string') return

    const parsed = parseImportedAppState(result)
    if (!parsed) {
      setImportError('That file doesn\'t look like a valid DriftTime backup.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const confirmed = window.confirm(
      'This will replace all your current data. Continue?',
    )
    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    saveAppState(parsed)
    commitAppState(parsed)
    setImportError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  reader.readAsText(file)
}
```

### `src/App.tsx` — UI

Add an import/export row in the app footer, replacing the plain `<footer>` element:

```tsx
<footer className="app-footer">
  <div className="import-export">
    <button onClick={() => exportAppState(appState)} type="button">
      Export backup
    </button>
    <button onClick={() => fileInputRef.current?.click()} type="button">
      Import backup
    </button>
    <input
      accept=".json"
      aria-hidden="true"
      className="file-input-hidden"
      onChange={handleImportFile}
      ref={fileInputRef}
      tabIndex={-1}
      type="file"
    />
    {importError && (
      <p className="import-error" role="alert">
        {importError}
      </p>
    )}
  </div>
  <span>v{version}</span>
</footer>
```

### `src/App.css`

Add the shared button selector for import-export buttons, and the new layout classes. Add `.import-export button` to the existing shared button border/radius selector block.

```css
.import-export {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.file-input-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.import-error {
  color: var(--color-error, #c0392b);
  font-size: 0.85rem;
  margin: 0;
}
```

Update the footer layout to separate the import/export controls from the version number:

```css
.app-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* existing rules unchanged */
}
```

---

## Acceptance

- Export button downloads a file named `drifttime-backup-YYYY-MM-DD.json` containing readable JSON.
- Import button opens a file picker.
- Picking a valid `.json` backup shows a confirm prompt; confirming replaces all state without a page reload.
- Picking an invalid file shows an inline error message and leaves existing data unchanged.
- The same file can be imported again after a first import (file input value is cleared).
- Dismissing the confirm prompt leaves existing data unchanged.
