# M5-02 — Shuffle Animation

**Milestone:** 5  
**PR:** 2 of 3  
**Scope:** Small — one new state value, key prop on task cards, CSS keyframes, reduced motion query

## Goal

When the grid reshuffles (either from the Reshuffle button or a filter change), task cards animate in with a subtle fade-and-rise so the new selection feels deliberate rather than abrupt. Animation is disabled for users who prefer reduced motion.

## Files changed

- `src/App.tsx`
- `src/App.css`

---

## Implementation

### `src/App.tsx` — grid generation counter

Add one new state value near `gridTaskIds`:

```ts
const [gridGeneration, setGridGeneration] = useState(0)
```

Wherever `setGridTaskIds` is called, also increment `gridGeneration`. The two call sites are `reshuffleTasks` and `updatePreference` — both go through `getGridState`, so add a helper that does both together, or update each site:

```ts
function reshuffleTasks() {
  setAppState((currentState) => {
    const nextGridState = getGridState(currentState)
    setGridTaskIds(nextGridState.gridTaskIds)
    setGridGeneration((g) => g + 1)
    return nextGridState.state
  })
}

function updatePreference(
  preference:
    | { key: 'selectedContextId'; value: ContextFilter }
    | { key: 'selectedEffortSize'; value: EffortFilter }
    | { key: 'selectedTimeWindow'; value: TimeWindowFilter },
) {
  setAppState((currentState) => {
    const nextState = {
      ...currentState,
      preferences: {
        ...currentState.preferences,
        [preference.key]: preference.value,
      },
    }
    const nextGridState = getGridState(nextState)
    setGridTaskIds(nextGridState.gridTaskIds)
    setGridGeneration((g) => g + 1)
    return nextGridState.state
  })
}
```

### `src/App.tsx` — task card key

Change the `key` prop on each task card `<article>` from `task.id` to include the generation, so React remounts the element and the CSS entry animation replays:

```tsx
<article
  className="task-card"
  key={`${task.id}-${gridGeneration}`}
  style={{ borderTopColor: project?.color }}
>
```

Do the same for placeholder cards:

```tsx
{PLACEHOLDERS.slice(0, placeholderCount).map((placeholder, i) => (
  <article
    className="task-card placeholder-card"
    key={`placeholder-${i}-${gridGeneration}`}
  >
```

### `src/App.css`

Add the keyframe and apply it to task cards. Wrap the animation rule in a `prefers-reduced-motion: no-preference` query so it is opt-in by default and automatically skipped for users with reduced motion enabled in their OS or browser.

```css
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .task-card {
    animation: card-enter 0.18s ease both;
  }
}
```

The `both` fill mode ensures cards start invisible before the animation fires, preventing a flash of content on mount.

---

## Acceptance

- Reshuffling causes cards to animate in with a brief fade-and-rise.
- Changing context, effort, or time window also triggers the animation.
- Changing a preference that leaves the same tasks on screen still replays the animation (generation increments on every filter/shuffle change).
- Enabling "Reduce motion" in macOS Accessibility (or the browser equivalent) disables the animation; cards appear instantly.
- No layout shift occurs during or after the animation — the grid dimensions are stable.
