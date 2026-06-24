# Secure Query Execution and Security Hardening Design

MetricFlow will adopt an incremental Hexagonal Architecture around query execution. The design preserves the existing NestJS modules while centralizing SQL classification, authorization, execution, cancellation, and auditing behind testable ports. Datasources remain read-only by default, and only explicitly authorized interactive sessions may write.

## Decision summary

| Area | Decision |
|---|---|
| Architecture | Incremental hexagonal slices; no big-bang rewrite |
| Datasource default | `read_only` for existing and new datasources |
| Mode management | Only an organization `owner` may enable `read_write` |
| Interactive writes | Allowed for `owner` and `admin` on `read_write` datasources |
| Destructive SQL | Requires the user to type `CONFIRMAR` for each execution |
| Viewers | Always read-only |
| Dashboards | Always read-only, including public dashboards |
| Scheduled reports | Always read-only |
| Database permissions | Remain the final enforcement layer |

## Scope

This design addresses the validated findings around:

1. SQL authorization and destructive operations.
2. Real timeout cancellation.
3. Dashboard and scheduler policy enforcement.
4. Mandatory application secrets.
5. Encryption and redaction of datasource credentials.
6. Secure invitation activation.
7. Tenant-confined SQLite storage.
8. Safe HTML and CSV report generation.
9. The current frontend build failure in the scheduler UI.

Unrelated feature development and a repository-wide architectural rewrite are out of scope.

## Architecture

```text
HTTP controller / Dashboard / Scheduler
                    |
                    v
          QueryExecutionService
          (application use case)
              /      |       \
             v       v        v
      SQL Policy  Driver Port  Audit Port
                     |
                     v
        PostgreSQL / MySQL / SQLite /
           BigQuery / Snowflake adapters
```

### Dependency rule

- Controllers, cron handlers, and dashboard services drive the application use case.
- The application use case depends on focused ports and technology-independent policies.
- Database SDKs, Prisma, NestJS exceptions, and HTTP response details remain in adapters.
- Provider-specific errors are translated into stable application errors.

### Proposed slice

```text
backend/src/query-execution/
├── application/
│   ├── query-execution.service.ts
│   ├── query-execution.types.ts
│   └── query-execution.errors.ts
├── domain/
│   ├── sql-classifier.ts
│   └── query-execution-policy.ts
├── ports/
│   ├── query-driver.port.ts
│   └── query-audit.port.ts
└── adapters/
    ├── drivers/
    │   ├── postgres-query-driver.ts
    │   ├── mysql-query-driver.ts
    │   ├── sqlite-query-driver.ts
    │   ├── bigquery-query-driver.ts
    │   └── snowflake-query-driver.ts
    └── prisma-query-audit.adapter.ts
```

The exact file split may be reduced during implementation if an interface has no real substitution or testing value.

## Execution contexts and authorization

The application use case receives an explicit execution context rather than inferring behavior from the caller.

```ts
type ExecutionContext =
  | { kind: 'interactive'; role: 'owner' | 'admin' | 'viewer' }
  | { kind: 'dashboard' }
  | { kind: 'scheduled_report' };
```

### Authorization matrix

| Context | Read | Write | Destructive |
|---|---:|---:|---:|
| Interactive owner/admin + `read_write` | Yes | Yes | With `CONFIRMAR` |
| Interactive + `read_only` | Yes | No | No |
| Interactive viewer | Yes | No | No |
| Dashboard, private or public | Yes | No | No |
| Scheduled report | Yes | No | No |

Application authorization complements the database user's native permissions. It never grants a capability that the database connection denies.

## Datasource execution mode

Add a persisted datasource mode:

```ts
type DatasourceExecutionMode = 'read_only' | 'read_write';
```

Requirements:

- Prisma migration adds a non-null field defaulting to `read_only`.
- Existing records migrate to `read_only`.
- New records default to `read_only`.
- Only an `owner` can change the mode.
- An `admin` may use an already enabled `read_write` datasource but cannot enable it.
- Execution mode remains separate from row- and column-level access policies.

### Configuration endpoint

```http
PUT /api/datasources/:id/execution-mode
Content-Type: application/json

{ "executionMode": "read_write" }
```

The service verifies both organization ownership and the caller's current database-backed role.

## Interactive execution contract

```http
POST /api/queries/run
Content-Type: application/json

{
  "datasourceId": "uuid",
  "querySql": "DROP TABLE obsolete_records",
  "destructiveConfirmation": "CONFIRMAR"
}
```

The backend always classifies the SQL. It does not trust a client-provided classification.

When confirmation is required:

```json
{
  "statusCode": 409,
  "code": "DESTRUCTIVE_CONFIRMATION_REQUIRED",
  "classification": "destructive"
}
```

The SQL editor displays a modal requiring the exact text `CONFIRMAR`, then retries the request with the confirmation field. A normal confirmation button is insufficient.

## SQL classification

Classification uses a dialect-aware SQL parser rather than regular expressions.

| Classification | Representative statements |
|---|---|
| `read` | `SELECT`, read-only `WITH`, `SHOW`, `DESCRIBE`, `EXPLAIN` |
| `write` | `INSERT`, conditioned `UPDATE`, `MERGE`, effectful procedures |
| `destructive` | `DROP`, `TRUNCATE`, `ALTER`, unconditioned `DELETE` or `UPDATE` |
| `multi_statement` | Multiple statements, evaluated at the highest detected risk |

Rules:

- Comments and whitespace do not affect classification.
- A CTE is classified from its effective statements, not its `WITH` prefix.
- Multiple statements inherit the highest-risk operation.
- SQL that cannot be classified safely is rejected.
- Parser support must be validated against PostgreSQL, MySQL, SQLite, BigQuery, and Snowflake syntax before choosing a library.

## Execution and cancellation

The driver port represents an active execution that can be cancelled:

```ts
interface QueryDriverPort {
  execute(request: QueryDriverRequest): Promise<QueryExecutionHandle>;
}

interface QueryExecutionHandle {
  result: Promise<QueryResult>;
  cancel(): Promise<void>;
}
```

Timeout behavior:

1. Start the driver operation.
2. Start the application timeout.
3. When the timeout expires, invoke `cancel()`.
4. Wait for cancellation or connection termination.
5. Return `QUERY_TIMEOUT`.

Adapters use native cancellation where reliable. Otherwise, they use a dedicated connection and terminate it. `Promise.race` alone is not accepted as cancellation.

Connection pools must not retain a connection whose cancellation state is unknown.

## Stable application errors

| Code | Meaning |
|---|---|
| `QUERY_NOT_ALLOWED` | Role, mode, or execution context forbids the statement |
| `DESTRUCTIVE_CONFIRMATION_REQUIRED` | A destructive statement lacks typed confirmation |
| `QUERY_TIMEOUT` | The timeout elapsed and cancellation was initiated |
| `QUERY_CANCELLED` | Execution was explicitly cancelled |
| `DRIVER_PERMISSION_DENIED` | The database connection rejected the operation |
| `QUERY_CLASSIFICATION_FAILED` | SQL could not be classified safely |

Controllers translate these errors into HTTP responses. Raw driver messages, credentials, connection strings, and internal stack traces are not returned.

## Dashboard and scheduled execution

Dashboard widgets and scheduled reports call the same `QueryExecutionService` with explicit read-only contexts.

They must not:

- Call a raw database driver directly.
- Reuse interactive write authorization.
- Skip datasource row- and column-level policies.
- Execute stored SQL that is classified as write or destructive.

Scheduled reports must define the applicable data-access policy explicitly. Until a separate service identity model is designed, they execute with a read-only policy that cannot exceed the access granted when the schedule is configured.

## Security hardening slices

### Mandatory secrets

- `JWT_SECRET` and `ENCRYPTION_KEY` are required and distinct.
- The application fails during bootstrap when either is missing.
- Encryption keys are never derived from JWT secrets.
- No production-capable fallback secrets remain in source code.

### Credential protection

A driver-aware credential service owns encryption and redaction.

- Encrypt `password`, `serviceAccountJson`, and future secret fields.
- Decrypt credentials only inside datasource/driver adapters.
- API responses expose safe metadata such as `hasCredentials`.
- Controllers never receive decrypted credential objects.

### Invitations

- Invitations use cryptographically random, one-time, expiring tokens.
- Only the token hash is stored.
- The invited user sets a password during activation.
- Resending revokes prior active invitations for that user and organization.
- No placeholder account can authenticate with a shared password.

### Tenant file storage

- SQLite/CSV datasources store managed file identifiers, not arbitrary paths.
- A tenant storage port resolves identifiers below `storage/org_<id>`.
- Resolution uses `realpath` and confirms the result remains inside the tenant directory.
- Traversal, absolute paths, and symbolic links escaping the tenant directory are rejected.

### Report output safety

- Escape report titles, column names, and values before inserting them into HTML.
- Continue RFC-compatible CSV quoting.
- Prefix spreadsheet-formula values beginning with `=`, `+`, `-`, or `@` to prevent formula execution.

## Testing strategy

Strict TDD applies to every behavior change.

### Unit tests

- SQL classification across supported dialect constructs.
- Role, context, mode, and confirmation authorization matrix.
- Fail-closed classification.
- Stable error mapping.
- Credential encryption and response redaction.
- Invitation expiration, one-time use, and revocation.
- Tenant file traversal and symlink rejection.
- HTML escaping and CSV formula neutralization.

### Adapter tests

- Driver execution and cancellation.
- Connection cleanup after success, error, timeout, and cancellation.
- Database permission-denied translation.

### Integration and E2E tests

- Owner-only execution-mode changes.
- Admin write execution on `read_write`.
- Viewer write denial.
- Dashboard and scheduler write denial.
- Row- and column-level policies applied to dashboard and scheduled results.
- Cross-organization datasource and schedule denial.
- Application bootstrap failure without required secrets.

### Frontend tests and validation

- Fix the current scheduler modal TypeScript build errors first.
- Confirm the destructive modal requires exact `CONFIRMAR`.
- Confirm a 409 response triggers the modal and retry flow.
- Confirm other query errors do not trigger destructive confirmation.
- Run the production frontend build after each UI slice.

## Incremental migration sequence

1. Restore a passing frontend build without changing behavior.
2. Add the SQL classifier and execution policy behind unit tests.
3. Add `executionMode` migration and owner-only configuration.
4. Route interactive execution through the application use case.
5. Route dashboards and scheduled reports through read-only execution.
6. Introduce cancellable driver adapters incrementally.
7. Enforce mandatory secrets and credential protection.
8. Replace fixed-password invitations.
9. Constrain tenant file storage.
10. Escape report output and neutralize CSV formulas.
11. Run backend lint, build, unit tests, E2E tests, and frontend lint/build.

Each step must leave the application functional and must not silently expand permissions.

## Migration risks

| Risk | Mitigation |
|---|---|
| Parser lacks a provider-specific construct | Build a dialect corpus before library selection; fail closed |
| Existing workflows depend on write access | Default to read-only and require explicit owner enablement |
| Cancellation damages pooled connections | Use dedicated connections until adapter behavior is verified |
| Scheduler changes are already in progress locally | Preserve current changes and migrate the scheduler as a later isolated slice |
| Credential format changes break existing records | Add versioned encryption metadata and a backward-compatible read path |
| Invitation migration leaves placeholder accounts | Identify and disable accounts created with the legacy shared credential |

## Acceptance checklist

- [ ] Existing and new datasources default to `read_only`.
- [ ] Only owners can enable `read_write`.
- [ ] Owners and admins can execute permitted interactive writes.
- [ ] Destructive SQL requires exact typed confirmation.
- [ ] Viewers, dashboards, and schedules cannot write.
- [ ] SQL classification fails closed.
- [ ] Timeouts cancel or terminate the underlying operation.
- [ ] Dashboard and scheduler execution applies datasource access policies.
- [ ] Missing JWT or encryption secrets prevents startup.
- [ ] Sensitive credentials are encrypted and never returned.
- [ ] Invitations use expiring one-time activation tokens.
- [ ] SQLite files cannot escape tenant storage.
- [ ] HTML and CSV report output is safe.
- [ ] Backend lint/build/tests/E2E and frontend lint/build pass.
