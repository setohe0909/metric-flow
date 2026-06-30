# Feature Catalog

MetricFlow is a self-hosted BI workspace for SQL analytics, dashboards, scheduled reports, and governed datasource access. This page reflects the current repository state on `main`, including the Stage 5 hardening work merged through `fix/stage5-hardening`.

## Feature matrix

| Area | Available today | Notes |
|---|---|---|
| Installation | One-time setup wizard | Creates one organization and first administrator. Existing installs use `/login`. |
| Authentication | JWT login, `/auth/me`, password change | Tokens include active organization, role, and password version. |
| Organizations | Single active workspace, members, roles | Roles: `ADMIN`, `EDITOR`, `READER`. |
| Datasources | PostgreSQL, MySQL, SQL Server, SQLite upload, CSV upload, BigQuery, Snowflake | SQLite/CSV are created through secure upload flow, not raw connection creation. |
| SQL editor | Monaco editor, schema browser, run/cancel/save query | Query execution is read-only and audited. |
| Query library | Saved SQL with datasource binding | Saved queries feed widgets and schedules. |
| Schedules | Cron-based query delivery | Sends CSV, HTML, or JSON reports; falls back to console logging when SMTP is not configured. |
| Dashboards | List/detail, pages, layout editing, widgets | Dashboards create a default `Resumen` page. |
| Widgets | Table, bar, stacked bar, line, pie, KPI, text/divider/image-style content | Widgets support layout, chart config, visual config, data config, and interaction config. |
| Public sharing | Public dashboard links and widget data endpoints | Public links use share tokens and can be revoked. |
| Access policies | Row filters and allowed columns per datasource role | Policies can be configured for `READER` and `EDITOR`; only `ADMIN` updates them. |
| Audit | Recent audit log endpoint | `READER` cannot read audit logs. |
| UI | Light/dark theme, Spanish/English UI, documentation route | Preferences are stored in local storage. |
| Release checks | Local release scripts and GitHub pre-release workflow | TestSprite integration is available through repo scripts. |

## User roles

| Role | Intended capabilities |
|---|---|
| `ADMIN` | Manage users, settings, datasources, access policies, content, audit visibility, and sharing. |
| `EDITOR` | Create analytical content, manage datasources, run read-only SQL, build dashboards and widgets. |
| `READER` | Consume published analytical content and run governed dashboard-backed reads. Cannot manage policies or audit logs. |

## Datasources

| Type | Configuration fields |
|---|---|
| PostgreSQL / MySQL | `host`, `port`, `username`, `password`, `database`, optional `ssl`. |
| SQL Server | `host`, `port`, `username`, `password`, `database`, optional `schema`, optional `ssl`. |
| SQLite | Uploaded file stored per organization. |
| CSV | Uploaded file imported into an organization-scoped SQLite database. |
| BigQuery | `projectId`, `database` dataset, encrypted `serviceAccountJson`. |
| Snowflake | `account`, `username`, `password`, `database`, `warehouse`, optional `schema`. |

Datasource passwords and service account JSON are encrypted before persistence. API responses mask sensitive settings.

## SQL execution

- Queries are normalized through the read-only SQL policy before execution.
- Execution timeout is 30 seconds.
- Users can cancel active executions.
- PostgreSQL, MySQL, SQL Server, SQLite/CSV, BigQuery, and Snowflake execution paths are supported.
- Execution records track SQL, user, duration, row count, status, and error message.
- Dashboard widget data runs through the same query service so role policies continue to apply.

## Dashboard Studio

Dashboard Studio supports multi-page dashboards and configurable widgets:

- Default dashboard page: `Resumen`.
- Page-aware widgets via `pageId`.
- Layout persistence with `layoutX`, `layoutY`, `layoutW`, and `layoutH`.
- Narrative widgets through visual/data/interaction configuration fields.
- Reader-safe dashboard responses exclude query internals.

## Public dashboards

Public dashboards are separate from internal publication status:

| Concept | Field | Behavior |
|---|---|---|
| Internal publish | `publishedAt` | Controls what `READER` users can see inside the app. |
| Public sharing | `isPublic` + `shareToken` | Enables unauthenticated `/dashboards/public/:token` API/view access. |

Turning public sharing off clears the share token.

## Schedules and email reports

Schedules run every minute and execute due cron jobs. Each schedule records history with status, error, and recipients.

Supported output formats:

- `csv`
- `html`
- `json`

If SMTP variables are missing, reports are logged to the backend console instead of sent.

## Current roadmap gaps

These are still roadmap items, not complete features:

- SAML / SSO.
- SCIM-style lifecycle management.
- Full dataset refresh orchestration.
- Query result caching and invalidation controls.
- Export flows for Excel, PDF, and image snapshots.
- Drill-down/drill-through and cross-widget interactions.
- Versioned dashboard publishing and rollback.
- Plugin/connector SDK.

## Next step

Configure the application with [Configuration](./configuration.md), or review [Security and hardening](./security-hardening.md).
