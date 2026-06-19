# Backend Agent Guidelines

## Scope and Architecture

These instructions apply to `backend/`. The API uses NestJS 11, Prisma with
PostgreSQL for application metadata, Passport JWT, and separate query drivers
for PostgreSQL, MySQL, SQLite, and CSV imports.

- Keep HTTP concerns in controllers and business logic in services.
- Keep features grouped in their existing NestJS module. Register new providers
  and dependencies through modules rather than constructing them manually.
- Use dependency injection and the shared `PrismaService`; do not create
  independent Prisma clients in feature code.
- Keep the global `/api` prefix and DTO validation behavior in `src/main.ts`.

## API and Validation

- Validate request input with DTOs using `class-validator` and appropriate
  transformations from `class-transformer`.
- Define response behavior deliberately; do not return password hashes,
  encrypted connection settings, secrets, or internal error details.
- Use NestJS HTTP exceptions for expected client errors.
- Preserve existing API contracts unless the requested change explicitly
  requires a breaking change.

## Organizations and Authorization

- Scope reads, writes, updates, and deletes by `organizationId` whenever the
  underlying model is organization-owned.
- Verify membership and required role server-side. Never trust an organization,
  role, user, datasource, dashboard, or query identifier from the client alone.
- Prevent cross-organization access when resolving related records.
- Keep public dashboard access limited to the intended share-token flow.

## Datasources and Query Execution

- Keep datasource connection settings encrypted at rest and decrypt them only
  when needed for a connection.
- Never log credentials, decrypted connection settings, JWTs, raw secrets, or
  sensitive query results.
- Do not interpolate untrusted values into application metadata queries.
- Preserve datasource-specific behavior in the query engine and close temporary
  connections and resources on both success and failure.
- Validate uploaded CSV data and avoid retaining temporary files unnecessarily.

## Prisma Changes

- Treat `prisma/schema.prisma` as the source of truth for the metadata model.
- Create a migration for persisted schema changes; do not rely on schema push as
  the deliverable migration strategy.
- Preserve mapped database names, relations, indexes, and deletion semantics
  unless a change explicitly requires otherwise.
- Review migrations for destructive operations and data-loss risk before
  applying them.
- Do not hand-edit generated Prisma Client files.

## Tests and Validation

- Place unit tests beside source files as `*.spec.ts`.
- Add or update end-to-end coverage in `test/` for changed routes or integrated
  authentication and persistence behavior.
- Include authorization and cross-organization denial cases for tenant-scoped
  behavior.

Run from `backend/`:

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```

The lint script applies fixes. Review its resulting diff before completing the
task.

