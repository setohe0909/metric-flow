# Configuration Reference

This page lists the runtime configuration and local state used by MetricFlow. Required secrets must be configured before starting the backend.

## Backend environment variables

| Variable | Required | Purpose | Notes |
|---|---:|---|---|
| `DATABASE_URL` | Yes | PostgreSQL metadata database URL | Used by Prisma. Example: `postgresql://postgres:postgres@localhost:5432/metricflow`. |
| `JWT_SECRET` | Yes | Signs authentication tokens | Must be present and non-empty. Do not reuse `ENCRYPTION_KEY`. |
| `ENCRYPTION_KEY` | Yes | Encrypts datasource credentials | Must be present and non-empty. Do not reuse `JWT_SECRET`. |
| `PORT` | No | API port | Defaults to `3000`. |
| `SMTP_HOST` | No | SMTP server host | Required for real email delivery. |
| `SMTP_PORT` | No | SMTP server port | Defaults to `587`; port `465` uses secure transport. |
| `SMTP_USER` | No | SMTP username | Required with `SMTP_HOST` and `SMTP_PASS`. |
| `SMTP_PASS` | No | SMTP password | Required with `SMTP_HOST` and `SMTP_USER`. |
| `SMTP_FROM` | No | Sender identity for reports | Defaults to `"MetricFlow Reports" <noreply@metricflow.io>`. |

When SMTP is not fully configured, scheduled reports are written to the backend logs in mock dispatch mode.

## Minimal backend `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metricflow"
JWT_SECRET="replace-with-a-long-random-secret"
ENCRYPTION_KEY="replace-with-a-different-long-random-secret"
PORT=3000
```

## Optional email configuration

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="reports@example.com"
SMTP_PASS="replace-with-smtp-password"
SMTP_FROM="MetricFlow Reports <reports@example.com>"
```

## Local services and ports

| Service | Default port | Command |
|---|---:|---|
| PostgreSQL metadata DB | `5432` | `docker compose up -d` |
| NestJS API | `3000` | `cd backend && npm run start:dev` |
| React/Vite frontend | `5173` | `cd frontend && npm run dev` |

## Install and migration commands

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

```bash
cd frontend
npm install
npm run dev
```

## Frontend local storage

| Key | Purpose |
|---|---|
| `metricflow_token` | JWT used by the API client. Cleared on logout or 401. |
| `metricflow_active_org_id` | Active organization header source. |
| `metricflow_locale` | UI language preference: `es` or `en`. |
| `metricflow_theme` | Theme preference: `light` or `dark`. |

## Datasource connection settings

| Datasource | Required settings |
|---|---|
| PostgreSQL | host, port, username, password, database; optional SSL. |
| MySQL | host, port, username, password, database; optional SSL. |
| SQL Server | host, port, username, password, database; optional schema and SSL. |
| SQLite | Upload a SQLite file through the datasource upload endpoint/UI. |
| CSV | Upload CSV; MetricFlow imports it into organization-scoped SQLite storage. |
| BigQuery | project ID, dataset/database, service account JSON. |
| Snowflake | account, username, password, database, warehouse, optional schema. |

## Release and verification configuration

Root scripts:

```bash
npm run test:release-tools
npm run release:test:testsprite
npm run release:check
```

TestSprite requires:

| Variable | Where |
|---|---|
| `TESTSPRITE_API_KEY` | Local environment and GitHub Actions secret. |
| `TESTSPRITE_PROJECT_ID` | Local environment and GitHub Actions repository variable. |

## Validation commands

Backend:

```bash
cd backend
npm run lint
npm run build
npm test
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Next step

Review the [Feature Catalog](./features.md) to understand what these settings enable.
