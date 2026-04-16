# DriftTime Implementation Plan

## Build Target

Build DriftTime as a single-user local web app:

- Vite
- React
- TypeScript
- Plain CSS
- localStorage persistence

Do not add a backend, auth, database, Docker, mobile build chain, cloud sync, or external state library for V1.

## Suggested Project Setup

From the repository root:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

If the directory is not empty when scaffolding, use the Vite option that allows creating in the current folder or scaffold in a temporary folder and copy the generated app files in.

## Folder Structure

Use a small, direct structure:

```text
src/
  components/
    AppShell.tsx
    ContextTabs.tsx
    EffortSelector.tsx
    TimeWindowSelector.tsx
    ShuffleButton.tsx
    TaskGrid.tsx
    TaskCard.tsx
    ProjectSidebar.tsx
    ProjectForm.tsx
    TaskForm.tsx
    ArchivePanel.tsx
    ImportExportControls.tsx
  data/
    contexts.ts
    seed.ts
  lib/
    colors.ts
    filters.ts
    ids.ts
    selectors.ts
    shuffle.ts
    storage.ts
  types/
    app.ts
  App.tsx
  main.tsx
  styles.css
```

Avoid routing until there is a real need. V1 can be a single app screen with panels and modals.

## Data Model

Define the core types in `src/types/app.ts`:

```ts
export type ContextId = "home" | "work" | "mind" | "spirit" | "body";
export type EffortSize = "small" | "medium" | "big";

export type AppContext = {
  id: ContextId;
  name: string;
  icon: string;
};

export type Project = {
  id: string;
  contextId: ContextId;
  name: string;
  color: string;
  archived: boolean;
  createdAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  notes?: string;
  durationMinutes: number;
  effortSize: EffortSize;
  archived: boolean;
  completedAt?: string | null;
  createdAt: string;
  lastShownAt?: string | null;
};

export type Preferences = {
  selectedContextId: ContextId;
  selectedEffortSize: EffortSize;
  selectedTimeWindow: number;
  pinnedTaskIds: string[];
};

export type AppState = {
  projects: Project[];
  tasks: Task[];
  preferences: Preferences;
};
```

## Constants

Create fixed contexts in `src/data/contexts.ts`:

```ts
export const CONTEXTS = [
  { id: "home", name: "Home", icon: "house" },
  { id: "work", name: "Work", icon: "briefcase" },
  { id: "mind", name: "Mind", icon: "spark" },
  { id: "spirit", name: "Spirit", icon: "leaf" },
  { id: "body", name: "Body", icon: "heart" },
] as const;
```

Create time windows and effort labels in a small constants file or near the controls:

```ts
export const TIME_WINDOWS = [5, 15, 30, 45, 60, 90, 120] as const;
export const EFFORT_SIZES = ["small", "medium", "big"] as const;
```

## Persistence

Implement `src/lib/storage.ts`:

- `loadAppState(): AppState`
- `saveAppState(state: AppState): void`
- `exportAppState(state: AppState): string`
- `parseImportedAppState(json: string): AppState`

Storage rules:

- Use one localStorage key, such as `drifttime:v1`.
- If no saved state exists, return seeded state.
- Validate imported JSON enough to avoid crashing the app.
- Save after every meaningful state change.

## Seed Data

Create `src/data/seed.ts` with:

- One or two projects per context.
- Several tasks across effort sizes and durations.
- Enough eligible starter tasks that the grid has useful cards immediately.

Seed data should teach task granularity by example. Prefer "Reply to 1 email" over "Inbox."

## Core Filtering

Implement `src/lib/filters.ts`:

```ts
export function getEligibleTasks(state: AppState): Task[] {
  // task is active
  // project is active
  // project context matches selected context
  // effort matches selected effort
  // durationMinutes <= selectedTimeWindow
}
```

Edge cases:

- If a project is archived, its tasks should not appear.
- If a pinned task no longer matches filters, it should not appear in the current grid.
- If a task's project no longer exists, exclude it.

## Shuffle Logic

Implement `src/lib/shuffle.ts`:

1. Get eligible tasks.
2. Split into pinned and unpinned.
3. Keep pinned eligible tasks first.
4. Sort or weight unpinned tasks so recently shown tasks are less likely to reappear.
5. Shuffle the remaining tasks.
6. Return up to 9 task ids.
7. Fill display slots with placeholders in the component layer.

Keep the first version understandable. A simple anti-repeat rule is enough:

- Prefer tasks with no `lastShownAt`.
- Then prefer oldest `lastShownAt`.
- Then randomize within that order.

After generating a new grid, update `lastShownAt` for shown task ids.

## App State Management

Use React state in `App.tsx`:

- Initialize from `loadAppState`.
- Save with `useEffect` whenever state changes.
- Store the current grid task ids separately from the saved app state if needed.
- Persist pinned task ids inside preferences.

No Redux, Zustand, React Query, or router is needed for V1.

## UI Components

### AppShell

Desktop layout:

- Top control bar.
- Left project sidebar.
- Main task grid.
- Optional right-side editing panel or modal.

### ContextTabs

Displays the five fixed contexts. Changing context:

- Updates preferences.
- Regenerates the grid.
- Clears no data.

### EffortSelector

Displays:

- Small Bite
- Medium Bite
- Big Bite

Changing effort size updates preferences and regenerates the grid.

### TimeWindowSelector

Displays fixed time options. Changing the time window updates preferences and regenerates the grid.

### TaskGrid

Renders 9 stable slots. Each slot contains either:

- TaskCard
- PlaceholderCard

The layout should not jump during shuffle, hover, pinning, or completion.

### TaskCard

Shows task title, duration, effort size, and a project cue. Includes:

- Done action
- Pin/unpin action
- Edit/open action

Done action:

- Sets `archived: true`
- Sets `completedAt` to current ISO timestamp
- Removes task from pinned ids
- Regenerates grid

### ProjectSidebar

Shows projects in the selected context. Supports:

- Add project
- Edit project
- Archive project
- Select project for task management

### TaskForm

Supports:

- Add task
- Edit task
- Title
- Notes
- Project
- Duration
- Effort size
- Archive/unarchive

Do not require notes.

### ArchivePanel

V1 should include a simple way to see archived tasks and optionally restore them.

### ImportExportControls

Support:

- Download/export JSON.
- Import JSON from file input or pasted text.

Import should confirm before replacing current local state.

## Styling Direction

Use plain CSS in `src/styles.css`.

Requirements:

- Desktop-first, responsive enough for smaller windows.
- Calm, friendly, readable.
- No dense corporate dashboard look.
- Large tap/click targets.
- Stable 3x3 grid dimensions.
- Reduced motion support.
- Project colors should be vivid enough to differentiate but softened on task cards.

Implementation details:

- Use CSS grid for the 3x3 layout.
- Use CSS variables for colors and spacing.
- Keep border radii at 8px or less.
- Avoid card-inside-card nesting.
- Make the main grid feel like the primary workspace, not an embedded preview.

## Milestones

### Milestone 1: Running Shell

- Scaffold Vite React TypeScript app.
- Add base layout.
- Add fixed contexts.
- Add seeded state.
- Render a static 3x3 grid.

Acceptance:

- `npm run dev` starts the app.
- The browser shows a recognizable DriftTime workspace with seeded task cards.

### Milestone 2: Filtering And Shuffle

- Add context, effort, and time controls.
- Implement eligible task filtering.
- Implement reshuffle.
- Add placeholders for empty slots.

Acceptance:

- Controls change the grid.
- Reshuffle returns a new bounded set of eligible tasks.
- Empty space is filled with supportive placeholders.

### Milestone 3: Persistence

- Add localStorage load/save.
- Persist preferences, projects, tasks, and pinned ids.

Acceptance:

- Refreshing the browser keeps data and preferences.

### Milestone 4: Project And Task CRUD

- Add project form.
- Add task form.
- Edit and archive projects/tasks.
- Show archived task view.

Acceptance:

- User can create a new project and task, then see the task appear when filters match.

### Milestone 5: Complete And Pin

- Add done action.
- Add pin/unpin.
- Ensure completed tasks archive and leave the active grid.
- Ensure pinned tasks survive reshuffle while still eligible.

Acceptance:

- Done task disappears from active grid and is visible in archive.
- Pinned task remains during reshuffle.

### Milestone 6: Export, Import, Polish

- Add JSON export.
- Add JSON import with confirmation.
- Add shuffle animation.
- Add reduced motion support.
- Improve empty states and microcopy.

Acceptance:

- User can back up and restore data.
- Shuffle feels pleasant but not distracting.

## Testing Checklist

Manual test V1 with these scenarios:

- First launch with no localStorage.
- Refresh after creating a project.
- Refresh after creating a task.
- Filter by each context.
- Filter by each effort size.
- Filter by each time window.
- Complete a task.
- Restore or view an archived task.
- Pin a task and reshuffle.
- Change filters so a pinned task becomes ineligible.
- Delete/archive a project that has active tasks.
- Export JSON.
- Import valid JSON.
- Try importing invalid JSON.
- Use keyboard navigation for primary controls.
- Enable reduced motion in the browser/OS and reshuffle.

## V1 Guardrails

Do not implement these during V1 unless the spec changes:

- Accounts
- Backend API
- Database
- Cloud sync
- Calendar
- Notifications
- Mobile/native shell
- User-created contexts
- Subtasks
- AI assistance
- Drag-and-drop
- Time tracking
- Complex priority scoring UI

## Build Order For A Coding Agent

1. Scaffold the app.
2. Add types, constants, seed data, and storage.
3. Render the desktop shell with seeded tasks.
4. Implement filters and shuffle.
5. Add localStorage persistence.
6. Add project and task forms.
7. Add complete/archive behavior.
8. Add pinning.
9. Add import/export.
10. Polish styling, accessibility, and reduced motion.

Keep each step working before moving to the next. DriftTime should stay small enough that the whole app can be understood by reading the `src` folder.
