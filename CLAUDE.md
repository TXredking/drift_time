# DriftTime — Agent Guide

## Project overview

DriftTime is a local-first, single-user task activation tool built with Vite + React + TypeScript. No backend, no auth, no database. All state lives in `localStorage`.

See `docs/spec.md` for product decisions and `docs/plan.md` for the implementation plan and milestone status.

## Versioning

DriftTime uses semantic versioning (`MAJOR.MINOR.PATCH`) in `package.json` and git tags.

| Change | Bump |
|---|---|
| Bug fix or copy tweak within a shipped milestone | PATCH (0.1.x) |
| Milestone completed and deployed | MINOR (0.x.0) |
| localStorage schema change requiring data migration | MAJOR (x.0.0) |

**MAJOR bumps require a new localStorage key.** The current key is `drifttime:v1` in `src/lib/storage.ts`. If `AppState` changes in a breaking way, increment to `drifttime:v2` alongside the MAJOR bump and handle migration or re-seeding gracefully.

### Release process

1. Complete milestone acceptance criteria.
2. Run `npm run build` and verify locally.
3. Bump version in `package.json`.
4. Commit: `git commit -m "chore: bump version to x.y.z"`.
5. Tag: `git tag vx.y.z`.
6. Deploy updated `dist/` to Netlify.

## Key conventions

- No external state library — React state in `App.tsx` only.
- No routing — single screen with modals and panels.
- Save after every meaningful state change via `useEffect` watching `appState`.

## Dependencies

Prefer keeping the dependency surface small. Before adding any library or framework, weigh the concrete benefits (standardisation, accessibility, functionality, code reduction) against the costs (bundle size, maintenance burden, security exposure, added complexity).

If a dependency clears that bar, add it. If the tradeoff is unclear, **ask before adding**.

Current approved dependencies beyond the Vite + React + TypeScript scaffold:

- `@radix-ui/react-dialog` — headless dialog primitive; provides focus trapping, Escape key handling, and ARIA without requiring a CSS framework.
- `@radix-ui/react-tooltip` — headless tooltip primitive; used for the Archive button explanation in task modals.
