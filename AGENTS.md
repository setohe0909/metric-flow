# Repository Agent Guidelines

## Scope

These instructions apply to the entire MetricFlow repository. Read the closest
`AGENTS.md` before changing files inside `backend/` or `frontend/`; nested
instructions complement this file and take precedence for their scope.

## Repository Map

- `backend/`: NestJS API, Prisma schema and migrations, datasource drivers, and
  Jest tests.
- `frontend/`: React 19 and Vite application.
- `docs/`: Project documentation and assets.
- `docker-compose.yml`: Local PostgreSQL service.

## Working Agreements

- Keep changes focused on the requested behavior. Avoid unrelated refactors.
- Follow the existing TypeScript, naming, and module conventions in the area
  being changed.
- Do not commit secrets, local `.env` files, build output, coverage output, or
  dependency directories.
- Do not edit generated artifacts when the source file or generator can be
  changed instead.
- Preserve organization boundaries across API requests, persistence, caches,
  and client state.
- Treat datasource credentials, JWT secrets, encryption keys, share tokens,
  and query results as sensitive data. Never log or expose them unnecessarily.
- Add or update tests when behavior changes. Documentation-only changes do not
  require new tests.
- Do not modify user-authored changes outside the requested scope.

## Validation

Run commands from the application directory they belong to.

### Backend

```bash
cd backend
npm run lint
npm run lint:fix
npm run build
npm test
```

Run `npm run test:e2e` when changing API behavior, authentication, persistence,
or interactions between modules.

### Frontend

```bash
cd frontend
npm run lint
npm run lint:fix
npm run build
```

Use `npm run lint` as the default validation command in local checks and CI so
linting never mutates the working tree implicitly. Use `npm run lint:fix` only
when you intentionally want autofixes, then review the resulting diff.

Report any validation command that could not be run and why. Do not claim a
check passed unless it was executed successfully.

## Completion Checklist

- The change stays within the requested scope.
- Relevant nested `AGENTS.md` instructions were followed.
- Secrets and tenant boundaries remain protected.
- Relevant lint, build, and test commands pass.
- Documentation is updated when setup or externally visible behavior changes.
