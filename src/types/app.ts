export type ContextId = 'home' | 'work' | 'mind' | 'spirit' | 'body'

export type EffortSize = 'small' | 'medium' | 'big'

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
