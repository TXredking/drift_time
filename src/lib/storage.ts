import { defaultAppState } from '../data/seed'
import type { AppState } from '../types/app'

const STORAGE_KEY = 'drifttime:v1'

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<AppState>

  return (
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.tasks) &&
    Boolean(candidate.preferences)
  )
}

export function loadAppState(): AppState {
  try {
    const savedState = window.localStorage.getItem(STORAGE_KEY)

    if (!savedState) {
      return defaultAppState
    }

    const parsedState: unknown = JSON.parse(savedState)

    if (!isAppState(parsedState)) {
      return defaultAppState
    }

    return parsedState
  } catch {
    return defaultAppState
  }
}

export function saveAppState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

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
