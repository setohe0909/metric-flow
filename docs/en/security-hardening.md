# Security and Hardening

MetricFlow handles database credentials, query results, public dashboard links, and user access controls. This page summarizes the safeguards currently implemented in the repository, including Stage 5 hardening.

## Installation and secret safety

- `JWT_SECRET` is mandatory.
- `ENCRYPTION_KEY` is mandatory.
- `JWT_SECRET` and `ENCRYPTION_KEY` must be different.
- `.env` files must not be committed.
- Datasource passwords and BigQuery service account JSON are encrypted before storage.

## Authentication and session invalidation

- Login signs JWTs with user id, email, active organization id, role, and password version.
- Disabled users cannot log in.
- New/reset users can be forced through `mustChangePassword`.
- Password changes increment `passwordVersion`, invalidating older tokens when guards compare token version with current user state.
- The frontend API client clears auth local storage on `401` responses.

## Tenant and role boundaries

- Protected backend routes use `JwtAuthGuard` and `TenantGuard`.
- Tenant context comes from the active organization header or JWT fallback.
- Datasource, query, dashboard, widget, schedule, organization, and audit data are scoped by organization.
- Role guard protects datasource create/test/upload/delete and policy update paths.
- `READER` users cannot query audit logs.

## Datasource policies

Admins can configure per-role policies for `READER` and `EDITOR`:

| Policy | Behavior |
|---|---|
| `allowedColumns` | Restricts visible columns for the role. `null` means unrestricted. |
| `rowFilter` | Applies a SQL row filter for the role. `null` means unrestricted. |

These policies are stored on the datasource and applied through query execution paths that read datasource configuration.

## Read-only SQL execution

The query engine routes SQL through `SqlReadOnlyPolicy` before execution. Stage 5 hardening expanded coverage around connector behavior and unsafe query handling.

Implemented safeguards:

- Reject unsupported datasource types.
- Normalize and validate SQL before execution.
- Prevent multiple destructive statements from being executed as analytical reads.
- Execute PostgreSQL, MySQL, SQL Server, SQLite/CSV, BigQuery, and Snowflake through dedicated driver paths.
- Use 30-second execution timeout.
- Support user cancellation through execution ids.
- Track execution status and errors.

## SQL Server hardening

SQL Server support includes:

- Connection pool management.
- Optional schema filtering for schema discovery.
- Read-only query preparation through the common SQL policy.
- Tests for SQL Server read-only handling and connector behavior.

## Public dashboard safety

- Public dashboards use separate `shareToken` access.
- Public dashboard reads require `isPublic = true`.
- Disabling public access clears the share token.
- Public dashboard views are audit logged as `DASHBOARD_PUBLIC_VIEWED`.
- Public widget data runs with `READER` semantics.

## Audit coverage

Audit logs are persisted for important actions such as:

- Dashboard publish/unpublish.
- Public dashboard views.
- Schedule create/update/delete.
- Scheduled query execution outcomes.

The audit list endpoint caps result size between 1 and 200 records.

## Scheduled report safety

- Schedules must belong to the current organization.
- Cron expressions are parsed and validated before persistence.
- History records retain success/error status and recipients.
- SMTP credentials are optional; missing SMTP uses console mock dispatch.

## Public documentation safety

The `/docs` directory is intended to be publishable through GitHub Pages. Do not place secrets, private screenshots, customer data, database dumps, or query results in this directory.

## Next step

Use [Configuration](./configuration.md) to set secrets and SMTP safely.
