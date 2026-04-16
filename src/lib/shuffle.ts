import { getEligibleTasks } from './filters'
import type { AppState, Task } from '../types/app'

const GRID_SIZE = 9

function shuffleTasks(tasks: Task[]) {
  const shuffled = [...tasks]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }

  return shuffled
}

function lastShownValue(task: Task) {
  return task.lastShownAt ? Date.parse(task.lastShownAt) : 0
}

export function createGridTaskIds(state: AppState): string[] {
  const eligibleTasks = getEligibleTasks(state)
  const pinnedTaskIds = new Set(state.preferences.pinnedTaskIds)
  const pinnedTasks = eligibleTasks.filter((task) => pinnedTaskIds.has(task.id))
  const unpinnedTasks = eligibleTasks.filter(
    (task) => !pinnedTaskIds.has(task.id),
  )

  const sortedUnpinnedTasks = shuffleTasks(unpinnedTasks).sort(
    (firstTask, secondTask) =>
      lastShownValue(firstTask) - lastShownValue(secondTask),
  )

  return [...pinnedTasks, ...sortedUnpinnedTasks]
    .slice(0, GRID_SIZE)
    .map((task) => task.id)
}

export function markTasksShown(state: AppState, taskIds: string[]): AppState {
  const shownTaskIds = new Set(taskIds)
  const shownAt = new Date().toISOString()

  return {
    ...state,
    tasks: state.tasks.map((task) =>
      shownTaskIds.has(task.id) ? { ...task, lastShownAt: shownAt } : task,
    ),
  }
}
