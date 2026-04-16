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
