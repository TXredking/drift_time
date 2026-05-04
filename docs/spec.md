# DriftTime Product Spec

## Purpose

DriftTime is a single-user, local desktop browser app for navigating unstructured time. It helps the user choose something doable without opening a long, guilt-inducing to-do list.

The core interaction is a 3x3 grid of shuffled task cards filtered by context, available time, and subjective effort size. The product is intentionally a task activation tool, not a full task management system.

## Product Principles

- Reduce decision fatigue by showing a bounded set of options.
- Help the user start, especially when task initiation is the hard part.
- Keep setup lightweight enough that the app can become useful quickly.
- Use gentle randomness, but avoid pure randomness that hides important work forever.
- Favor calm, playful, nonjudgmental language.
- Avoid features that turn the app into a calendar, project management suite, or productivity scoreboard.

## Target User

V1 is for one local user running the app on a desktop or laptop browser. The initial user is assumed to be neurodivergent or otherwise prone to task initiation difficulty, time blindness, overwhelm, avoidance loops, or trouble using unstructured time well.

V1 does not need accounts, sync, mobile packaging, collaboration, or multi-user data modeling.

## V1 Experience

The user starts the app locally, opens it in a browser, and sees a desktop-first layout:

- Top controls for context, effort size, time window, and reshuffle.
- Left project sidebar.
- Main 3x3 grid of task cards.
- Task/project management in simple panels or modals.

The app should be usable with seeded starter data so the first experience is not an empty setup chore.

## Core Concepts

### Contexts

Contexts are fixed in V1. The user does not create, delete, reorder, or customize them.

Required contexts:

- Home
- Work
- Mind
- Spirit
- Body

Each context should have an app-assigned icon or simple visual label.

### Projects

Projects are user-created groupings within a context. A project has:

- Name
- Context
- Color
- Archived status

Example projects:

- Home: Kitchen, Errands, Decluttering
- Work: Admin, Writing, Follow-ups
- Body: Exercise, Food Prep

### Tasks

Tasks belong to projects. A task should represent a small, concrete action whenever possible, but V1 should not require perfect task breakdown before the user can use the app.

A task has:

- Title
- Optional notes
- Project
- Duration estimate
- Effort size
- Archived status
- Completion timestamp
- Created timestamp

Task cards inherit their display color from the project color. V1 should not include separate task color editing.

## Effort Size

V1 replaces mood tagging with subjective effort size:

- Small Bite
- Medium Bite
- Big Bite

This keeps labeling simple and personal. A phone call might be a Big Bite for one person and a Small Bite for another.

## Time Windows

V1 supports short, fixed time windows:

- 5 minutes
- 15 minutes
- 30 minutes
- 45 minutes
- 60 minutes

90 and 120 minutes are excluded. They are unrealistic as activation-focused time slots and push the app toward project planning rather than task execution.

The grid should show tasks whose estimated duration is less than or equal to the selected time window. Exact matching is too brittle.

## Main Grid

The task grid is the primary workspace. The layout should treat it as the center of attention — not a panel embedded in a management interface. When the user is in execution mode, nothing should compete with the grid for focus.

The main screen displays 9 grid slots. Each populated task card should show:

- Task title
- Estimated duration
- Effort size
- Optional project cue if it helps orientation without clutter

Grid behavior:

- The grid populates on app load using saved preferences.
- The user can reshuffle on demand.
- Archived tasks are excluded.
- Tasks are filtered by selected context, effort size, and time window.
- If fewer than 9 eligible tasks exist, remaining cells use supportive placeholders.
- The user can mark a task done from the card.
- Done tasks are archived immediately.

### Task card interaction

Clicking a task card opens a card modal. The modal opens in read mode and shows full task details including notes. It contains:

- Edit button — switches the modal to edit mode (title, notes, project, duration, effort size)
- Done button — archives the task with a completion timestamp and closes the modal
- Archive button — archives the task without a completion timestamp and closes the modal

A tooltip on the Archive button explains the distinction: "Archive removes this task from your active list without marking it complete."

The same modal can be opened from the task list inside the project modal, so users can find and edit a specific task without relying on the shuffle to surface it.

Supportive placeholders may include:

- Take a short walk
- Drink water
- Breathe for 2 minutes
- Clear 5 items from a surface
- Rest is allowed

## Pinning

V1 should support simple pinning:

- A user can pin a task card.
- Pinned tasks remain on the grid during reshuffle if they still match the current filters.
- V1 does not need drag-and-drop pinning.

## Shuffle Behavior

The app should use guided randomness rather than pure randomness.

Baseline V1 eligibility:

- Task is not archived.
- Task belongs to a project in the selected context.
- Task effort size matches the selected effort size.
- Task duration is less than or equal to the selected time window.

Recommended V1 selection:

- Preserve currently pinned eligible tasks.
- Shuffle unpinned eligible tasks.
- Prefer tasks that have not appeared recently when possible.
- Fill up to 9 slots.
- Fill remaining slots with placeholders.

Avoid encouraging reshuffle loops. The UI may use gentle copy such as "Try one before reshuffling?" after repeated reshuffles, but it should not shame or block the user.

## Task Management

V1 should support:

- Add project
- Edit project
- Archive project
- Add task
- Edit task
- Archive task
- Mark task done
- View archived/completed tasks

V1 should avoid requiring users to fully decompose a big vague task before saving it. A rough task can be captured and clarified later.

### Project sidebar

The left sidebar lists projects in the selected context. It is collapsible so users in execution mode can dismiss it and focus entirely on the task grid.

Clicking a project in the sidebar opens a project modal — it does not scroll the page or reveal an inline panel below the sidebar. This keeps the purpose of the sidebar clear: project selection triggers a modal, not a below-the-fold content change the user might miss.

The project modal contains:

- Project name and color edit fields
- Archive project button
- Full list of the project's active tasks
- Add task button
- Each task in the list is clickable and opens the task card modal

### Project sidebar collapse behavior

- A toggle button (chevron or similar) collapses the sidebar to a narrow icon rail or hides it entirely.
- Collapsed state persists in preferences across sessions.
- Collapsing does not change the selected context or affect the grid.

## Starter Data

V1 should seed useful starter projects and tasks so the first launch is immediately meaningful.

Starter tasks should demonstrate good granularity:

- Clear 5 items from desk
- Reply to 1 email
- Open a project and read the last note
- Put away 3 things
- Take a 5 minute walk
- Start laundry
- Text one person back
- Read one short passage

The starter data should be editable and removable.

## Persistence

V1 is local only.

Required:

- Save app state in browser localStorage.
- Persist projects, tasks, preferences, and pinned task ids.

Strongly recommended:

- Export JSON backup.
- Import JSON backup.

No backend, database, auth, or cloud sync is required for V1.

## Accessibility And Tone

The app should feel calm, approachable, and gently playful.

Requirements:

- Large click targets.
- Keyboard-accessible controls.
- Readable type.
- Sufficient color contrast.
- Reduced motion support for shuffle animation.
- User-facing copy should avoid guilt, urgency, streaks, overdue language, or moral judgment.

Preferred phrasing:

- "Here's what you could do."
- "Try one."
- "Rest is allowed."
- "Done for now."

Avoid:

- "You are behind."
- "Overdue."
- "Failed."
- "You must."

## Explicitly Out Of Scope For V1

- User-created contexts
- Login or accounts
- Cloud sync
- Mobile/native app packaging
- Calendar integration
- Notifications
- Geofencing
- Collaboration
- Time tracking
- Subtasks
- Recurring tasks
- AI task breakdown
- Drag-and-drop
- Analytics dashboards
- Priority matrices or complex scoring UI

## Recurring Tasks — Design Rationale

Recurring tasks are explicitly out of scope for V1, and the reasons are worth documenting to handle future requests clearly.

DriftTime is a progress tool, not a maintenance tracker. Recurring tasks — cleaning, watering plants, weekly reviews — have no end state. They are not suited to this app's model of making progress toward a project's definition of done.

Some projects appear to have repeatable steps (e.g. "Learn Calculus" → "Do a lesson"). But even those are not truly recurring: lesson content changes with each session, and with a mastery-focused approach a given concept might need initial instruction, review, or practice — different task types entirely. The right model is to break those into discrete, concrete tasks with a clear exit condition (e.g. "Pass chapter 3 practice test"), not to clone a recurring task.

If a user requests recurring tasks, the appropriate response is to help them break down the project into specific, completable tasks. That is the usage pattern this app is designed to encourage.

## Future Ideas

These are possible later, but should not block V1:

- On-demand "break this down" suggestions.
- Import/export improvements.
- Task exposure history to identify avoided tasks.
- Weighted selection based on age, skipped appearances, and recent completions.
- Context reminders or time-window reminders.
- Native or PWA packaging.

## Success Criteria

V1 is successful if:

- The user can start the app with one terminal command after setup.
- The first launch shows useful sample tasks.
- The user can create projects and tasks.
- The grid reliably shows 9 relevant options or placeholders.
- Reshuffle feels satisfying without becoming the whole activity.
- Completing a task removes it from the active pool.
- Data survives browser refreshes.
- The app remains understandable without reading documentation.
