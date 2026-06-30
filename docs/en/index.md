# MetricFlow Documentation

MetricFlow is a self-hosted, open-source SQL analytics and dashboard platform. Use these docs to install it locally, create your first workspace, connect data, build dashboards, and contribute safely.

## Quick path

1. [Install MetricFlow](./getting-started.md) with Docker, Node.js, the NestJS API, and the React frontend.
2. [Complete the first-use setup](./tutorials.md#tutorial-1-create-the-first-workspace) to create the organization and owner account.
3. [Connect a datasource](./tutorials.md#tutorial-2-connect-a-datasource) and test the connection.
4. [Run and save a query](./tutorials.md#tutorial-3-run-and-save-a-query).
5. [Build and share a dashboard](./tutorials.md#tutorial-4-build-and-share-a-dashboard).

## Documentation map

| Page | Use it when you want to |
|---|---|
| [Getting started](./getting-started.md) | Run the project locally from a fresh clone. |
| [Feature catalog](./features.md) | See every implemented product capability and current roadmap gap. |
| [Configuration](./configuration.md) | Configure backend secrets, SMTP, datasources, frontend preferences, and release checks. |
| [Security and hardening](./security-hardening.md) | Understand Stage 5 hardening, role boundaries, read-only SQL, audit, and public sharing safety. |
| [Tutorials](./tutorials.md) | Learn the product through task-based walkthroughs. |
| [Contributing](./contributing.md) | Prepare a community contribution or bug report. |
| [Publishing](./publishing.md) | Publish `/docs` as a public GitHub Pages site. |
| [Español](../es/) | Read the same documentation in Spanish. |

## What MetricFlow includes today

- One self-hosted workspace per installation.
- JWT authentication with role-based access.
- Encrypted datasource credentials.
- SQL editor, saved queries, widgets, dashboards, schedules, audit logs, and public dashboard sharing.
- PostgreSQL metadata storage and drivers for PostgreSQL, MySQL, SQL Server, SQLite/CSV, BigQuery, and Snowflake.

## Documentation principles

- Keep the happy path first.
- Prefer checklists, examples, and screenshots over long prose.
- Mark security-sensitive steps clearly.
- Keep English and Spanish pages aligned when changing user-facing behavior.
