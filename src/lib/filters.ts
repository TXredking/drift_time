import type { AppState, Task } from '../types/app'

export function getEligibleTasks(state: AppState): Task[] {
  const { selectedContextId, selectedEffortSize, selectedTimeWindow } =
    state.preferences
  const activeProjectIds = new Set(
    state.projects
      .filter(
        (project) =>
          !project.archived &&
          (selectedContextId === 'all' ||
            project.contextId === selectedContextId),
      )
      .map((project) => project.id),
  )

  return state.tasks.filter(
    (task) =>
      !task.archived &&
      activeProjectIds.has(task.projectId) &&
      (selectedEffortSize === 'any' ||
        task.effortSize === selectedEffortSize) &&
      (selectedTimeWindow === 'any' ||
        task.durationMinutes <= selectedTimeWindow),
  )
}
