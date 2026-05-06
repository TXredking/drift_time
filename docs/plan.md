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
  sidebarCollapsed: boolean;
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
export const TIME_WINDOWS = [5, 15, 30, 45, 60] as const;
export const EFFORT_SIZES = ["small", "medium", "big"] as const;
```

## Persistence

Implement `src/lib/storage.ts`:

- `loadAppState(): AppState`
- `saveAppState(state: AppState): void`
- `exportAppState(state: AppState): void` — triggers a file download
- `parseImportedAppState(json: string): AppState | null` — returns null on invalid input

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
- Left project sidebar (collapsible).
- Main task grid — primary workspace, always front and center.
- Modals for project management and task detail/editing.

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

Shows task title, duration, effort size, and a project cue. Includes a pin/unpin toggle visible on hover.

Clicking the card opens the task card modal.

The task card modal opens in read mode. It contains:

- Full title and notes (read mode)
- Edit button — switches to edit mode (title, notes, project, duration, effort size)
- Done button — sets `archived: true`, sets `completedAt` to current ISO timestamp, removes from pinned ids, regenerates grid, closes modal
- Archive button — sets `archived: true`, leaves `completedAt` null, removes from pinned ids, regenerates grid, closes modal
- Tooltip on Archive button: "Archive removes this task from your active list without marking it complete."

### ProjectSidebar

Shows projects in the selected context. Collapsible via a toggle button; collapsed state persists in preferences.

Clicking a project opens the project modal — does not reveal inline content below the sidebar fold.

The project modal contains:

- Project name and color edit fields
- Archive project button
- List of active tasks for the project, each clickable to open the task card modal
- Add task button

### TaskForm

Used inside the task card modal in edit mode. Fields:

- Title
- Notes (optional)
- Project
- Duration
- Effort size
- Archive/unarchive toggle

### ArchivePanel

V1 should include a simple way to see archived tasks and optionally restore them.

### ImportExportControls

Support:

- Download/export JSON.
- Import JSON from a file picker.

Import should confirm before replacing current local state.

#### Export steps

1. Call `JSON.stringify(state, null, 2)` to produce readable JSON.
2. Wrap in a `Blob` with `type: 'application/json'`.
3. Create a temporary object URL via `URL.createObjectURL`.
4. Create a hidden `<a>` element, set `href` to the object URL and `download` to a filename such as `drifttime-backup-YYYY-MM-DD.json`.
5. Programmatically click the anchor to trigger the browser download dialog.
6. Revoke the object URL and remove the anchor element immediately after.

#### Import steps

1. Render a visually hidden `<input type="file" accept=".json">` and wire a visible "Import" button to open it via `.click()`.
2. On `change`, read the selected file using `FileReader.readAsText`.
3. On `load`, call `parseImportedAppState` which runs `JSON.parse` wrapped in try/catch and validates the result with `isAppState`.
4. If parsing fails, show an inline error message — do not modify state.
5. If parsing succeeds, show a confirmation prompt: "This will replace all your current data. Continue?"
6. On confirm, call `saveAppState` with the imported state, then call the state setter to update React state in place — no full page reload required.
7. Clear the file input value so the same file can be re-imported if needed.

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

### Milestone 1: Running Shell [DONE]

- Scaffold Vite React TypeScript app.
- Add types, constants, seed data, and storage.
- Add base layout with context tabs, effort selector, and time window selector.
- Render a 3x3 grid of seeded task cards.

Acceptance:

- `npm run dev` starts the app.
- The browser shows a recognizable DriftTime workspace with seeded task cards.

### Milestone 2: Filtering, Shuffle, and Persistence [DONE]

- Implement eligible task filtering by context, effort, and time window.
- Implement reshuffle with anti-repeat logic (`lastShownAt`).
- Add placeholders for empty grid slots.
- Add localStorage load/save; persist preferences, projects, tasks, and pinned ids.

Acceptance:

- Controls change the grid.
- Reshuffle returns a new bounded set of eligible tasks.
- Empty space is filled with supportive placeholders.
- Refreshing the browser keeps data and preferences.

### Milestone 3: Project and Task Management [DONE]

- Inline project sidebar with add/edit/archive actions.
- Task list per project with add/edit/archive/complete actions.
- Done: sets `archived: true` and `completedAt` to current timestamp.
- Archive: sets `archived: true`, leaves `completedAt` null.
- Archive panel showing completed and archived tasks, with restore.

Acceptance:

- User can create a new project and task, then see the task appear when filters match.
- Done and Archive produce distinct outcomes (`completedAt` set vs null).
- Completed and archived tasks appear in the archive panel with a restore button.

### Milestone 4: Modal-First UX and Sidebar Collapse [CURRENT]

The current inline sidebar management pattern predates a UX decision made during beta. These are the remaining V1 features:

- **Collapsible sidebar**: Add a toggle control (chevron or icon button) that collapses the sidebar to a narrow rail or hides it entirely. Add `sidebarCollapsed: boolean` to `Preferences` and persist it across sessions. Collapsing does not affect context, grid, or any other preference.
- **Task card modal**: Clicking a task card in the grid opens a modal in read mode showing full title and notes. The modal contains: Edit (switches to edit mode), Done, Archive with tooltip ("Archive removes this task from your active list without marking it complete.").
- **Project modal**: Clicking a project in the sidebar opens a project modal — not the current inline panel. The modal contains: project name/color edit, archive project button, active task list (each task clickable to open the task card modal), add task button.

Acceptance:

- Sidebar toggle collapses and expands; collapsed state survives a refresh.
- Clicking a task card in the grid opens the task card modal.
- Clicking a project in the sidebar opens the project modal, not an inline panel.
- Tasks are accessible from both the grid card modal and the project modal task list.
- Archive tooltip is visible on the Archive button.

### Milestone 5: Export, Import, and Polish

- Add `exportAppState` to `storage.ts` — serializes state to JSON and triggers a browser file download.
- Add `parseImportedAppState` to `storage.ts` — parses and validates JSON, returns `null` on failure.
- Build `ImportExportControls` component with an Export button and an Import button backed by a hidden file input.
- Show an inline error if imported JSON is invalid or unrecognized.
- Show a confirmation prompt before overwriting local state on import.
- Add shuffle animation.
- Add reduced motion support.
- Improve empty states and microcopy.

Acceptance:

- Export downloads a readable JSON file named with today's date.
- Importing a valid backup restores all projects, tasks, and preferences without a page reload.
- Importing a bad file shows an error and leaves existing data untouched.
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
8. Add import/export.
9. Polish styling, accessibility, and reduced motion.

Keep each step working before moving to the next. DriftTime should stay small enough that the whole app can be understood by reading the `src` folder.

## Beta Test Deploy Plan

### Goal

Share a working build with non-technical testers via a stable URL, with no local setup required on their end.

### Prerequisites

- Milestone 5 complete (export/import implemented and tested locally).
- `npm run build` produces a clean `dist/` folder with no TypeScript or lint errors.

### Deploy method: Netlify drag-and-drop

Netlify's drop UI requires no account on the tester's side and no config files in the repo.

1. Run `npm run build` locally to produce the `dist/` folder.
2. Go to [netlify.com/drop](https://app.netlify.com/drop) in a browser (free Netlify account required for the host, not the tester).
3. Drag the `dist/` folder onto the drop target.
4. Netlify generates a unique URL (e.g. `https://random-name.netlify.app`).
5. Share that URL with testers — no install, no terminal.

To update the build after changes: repeat steps 1–3. Netlify lets you re-deploy to the same site by dragging to the existing site's deploy page, preserving the URL.

For continuous deployment from GitHub (optional upgrade): connect the repo in the Netlify dashboard, set build command to `npm run build` and publish directory to `dist`. Pushes to `main` will redeploy automatically.

### Tester data workflow

Because each tester's data lives in their own browser's localStorage, data is not shared or synced between testers. The export/import feature is how testers preserve their data.

Guidance to give testers:

- Use the Export button periodically to save a backup `.json` file to their computer.
- If they switch browsers or clear site data, they can use Import to restore from that file.
- They can also send their export file to you directly as a way to share feedback alongside real usage data.

### What testers cannot do

- Share data with each other in real time.
- Access their data from a different browser or device without manually exporting and importing.
- Recover data if they clear localStorage without first exporting.

These are acceptable constraints for a V1 beta. If they become friction points, the next option is a lightweight cloud sync layer — out of scope for now.
