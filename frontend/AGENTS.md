# Frontend Agent Guidelines

## Scope and Architecture

These instructions apply to `frontend/`. The application uses React 19,
TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS, Recharts,
Monaco Editor, and React Grid Layout.

- Keep route definitions centralized in `src/App.tsx` unless the routing
  architecture is intentionally changed.
- Put route-level screens in `src/pages/`, shared UI in `src/components/`,
  layouts in `src/layouts/`, API infrastructure in `src/lib/`, and shared client
  state in `src/store/`.
- Reuse existing layouts and components before adding parallel abstractions.
- Keep components focused; extract reusable behavior when a page becomes
  responsible for unrelated concerns.

## Data and State

- Use TanStack Query for server state, including fetching, mutation lifecycle,
  invalidation, and loading or error states.
- Use Zustand only for shared client state that is not owned by the server, such
  as the active organization context.
- Keep API transport concerns in the shared API client rather than configuring
  ad hoc Axios instances in components.
- Do not expose credentials, JWTs, datasource connection settings, or sensitive
  query results through logs or user-facing error details.
- Invalidate or partition organization-scoped state when the active
  organization changes; never show cached data from another organization.

## React and TypeScript

- Prefer typed props, API payloads, and state. Avoid `any` when a meaningful
  local type can be defined.
- Use functional components and hooks. Follow the Rules of Hooks and keep effect
  dependency lists accurate.
- Handle loading, empty, error, and success states for asynchronous views.
- Preserve the existing public and protected route separation.
- Keep error-boundary behavior intact for unexpected render failures.

## UI and Accessibility

- Maintain responsive behavior for navigation, editors, dashboards, and forms.
- Use semantic HTML and accessible labels for controls, including icon-only
  actions.
- Ensure interactive elements are keyboard accessible and have visible focus
  treatment.
- Do not rely on color alone to communicate state.
- Avoid unnecessary visual redesign when implementing functional changes.

## Validation

There is currently no frontend test script. For behavioral changes, add focused
tests if test infrastructure is introduced as part of the task; otherwise state
the manual verification performed.

Run from `frontend/`:

```bash
npm run lint
npm run build
```

For UI changes, also verify the affected flow in the browser at relevant desktop
and narrow viewport sizes.
