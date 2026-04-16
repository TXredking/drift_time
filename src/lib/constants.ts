import type { EffortFilter, Preferences } from '../types/app'

export const TIME_WINDOWS = [5, 15, 30, 45, 60, 90, 120] as const

export const EFFORT_OPTIONS: Array<{ id: EffortFilter; label: string }> = [
  { id: 'any', label: 'Any Bite' },
  { id: 'small', label: 'Small Bite' },
  { id: 'medium', label: 'Medium Bite' },
  { id: 'big', label: 'Big Bite' },
]

export const DEFAULT_PREFERENCES: Preferences = {
  selectedContextId: 'all',
  selectedEffortSize: 'any',
  selectedTimeWindow: 'any',
  pinnedTaskIds: [],
}

export const PLACEHOLDERS = [
  'Take a short walk',
  'Drink water',
  'Breathe for 2 minutes',
  'Clear 5 items from a surface',
  'Rest is allowed',
  'Open a window',
  'Stretch your shoulders',
  'Write down the next tiny step',
  'Stand up for one minute',
]
