export type ContextId = 'home' | 'work' | 'mind' | 'spirit' | 'body'

export type EffortSize = 'small' | 'medium' | 'big'

export type ContextFilter = ContextId | 'all'

export type EffortFilter = EffortSize | 'any'

export type TimeWindowFilter = number | 'any'

export type AppContext = {
  id: ContextId
  name: string
  icon: string
}

export type Project = {
  id: string
  contextId: ContextId
  name: string
  color: string
  archived: boolean
  createdAt: string
}

export type Task = {
  id: string
  projectId: string
  title: string
  notes?: string
  durationMinutes: number
  effortSize: EffortSize
  archived: boolean
  completedAt?: string | null
  createdAt: string
  lastShownAt?: string | null
}

export type Preferences = {
  selectedContextId: ContextFilter
  selectedEffortSize: EffortFilter
  selectedTimeWindow: TimeWindowFilter
  pinnedTaskIds: string[]
  sidebarCollapsed: boolean
}

export type AppState = {
  projects: Project[]
  tasks: Task[]
  preferences: Preferences
}
