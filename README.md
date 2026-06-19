<div align="center">
  <img src="docs/assets/metricflow-logo.svg" alt="MetricFlow" width="520" />

  <p><strong>Connect your data, write SQL, and turn results into shareable dashboards.</strong></p>

  <p>
    <a href="https://github.com/setohe0909/metric-flow"><img src="https://img.shields.io/badge/status-active%20development-f7a501?style=flat-square" alt="Project status: active development" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5%20%7C%206-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /></a>
    <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/NestJS-11-e0234e?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS 11" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-15-4169e1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 15" /></a>
    <a href="LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License: MIT" /></a>
  </p>
</div>

## What is MetricFlow?

MetricFlow is a self-hosted analytics workspace for teams that need a focused path from raw data to useful dashboards. It brings datasource management, a browser-based SQL editor, configurable widgets, and dashboard sharing into one multi-tenant application.

> [!IMPORTANT]
> MetricFlow is under active development. APIs, setup steps, and data models may change before the first stable release.

## Highlights

| Capability | What it provides |
| --- | --- |
| **Datasource connections** | Connect PostgreSQL, MySQL, and SQLite databases or import CSV data. |
| **SQL workspace** | Explore schemas, write queries with Monaco-powered editing, and inspect tabular results. |
| **Dashboard builder** | Arrange responsive, drag-and-drop dashboards with persisted layouts. |
| **Visualization widgets** | Build tables, bar charts, line charts, pie charts, and KPI cards. |
| **Public sharing** | Share selected dashboards through token-based public URLs. |
| **Organizations** | Isolate users, connections, queries, and dashboards by organization and role. |
| **Credential protection** | Store datasource connection settings as encrypted payloads. |

## Preview

<div align="center">
  <img src="frontend/src/assets/hero.png" alt="MetricFlow product preview" width="343" />
</div>

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- npm
- [Docker](https://docs.docker.com/get-docker/) with Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/setohe0909/metric-flow.git
cd metric-flow
```

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

The development database is exposed at `localhost:5432` with the credentials defined in `docker-compose.yml`.

### 3. Configure and start the API

```bash
cd backend
npm install
```

Create `backend/.env` with these values:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metricflow?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
ENCRYPTION_KEY="replace-with-a-stable-32-byte-secret"
PORT=3000
```

Apply the checked-in migrations and start the API:

```bash
npx prisma migrate deploy
npm run start:dev
```

The API starts at `http://localhost:3000/api`.

> [!WARNING]
> Keep `ENCRYPTION_KEY` stable. Changing it prevents MetricFlow from decrypting previously saved datasource credentials.

### 4. Start the web app

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

To point the frontend at another API, create `frontend/.env.local`:

```dotenv
VITE_API_URL="http://localhost:3000/api"
```

## Architecture

```mermaid
flowchart LR
    UI["React + Vite web app"] -->|"REST / JWT"| API["NestJS API"]
    API --> META["PostgreSQL metadata store"]
    API --> ENGINE["Query engine"]
    ENGINE --> PG["PostgreSQL"]
    ENGINE --> MYSQL["MySQL"]
    ENGINE --> SQLITE["SQLite"]
    ENGINE --> CSV["CSV imports"]
```

MetricFlow keeps application metadata in PostgreSQL. The backend validates tenant context, decrypts datasource settings only when required, executes queries through the appropriate driver, and returns results to the React client.

## Technology stack

### Frontend

- React 19, TypeScript, and Vite
- Tailwind CSS 4
- TanStack Query and Zustand
- Monaco Editor
- Recharts and React Grid Layout

### Backend

- NestJS 11 and TypeScript
- Prisma ORM and PostgreSQL
- Passport JWT and bcrypt
- PostgreSQL, MySQL, and SQLite drivers
- Jest and Supertest

## Repository structure

```text
metric-flow/
├── backend/              # NestJS API, Prisma schema, and migrations
├── frontend/             # React application and product UI
├── docs/assets/          # Project branding used by documentation
├── docker-compose.yml    # Local PostgreSQL service
└── README.md
```

## Development commands

| Area | Command | Purpose |
| --- | --- | --- |
| Frontend | `npm run dev` | Start the Vite development server. |
| Frontend | `npm run build` | Type-check and create a production build. |
| Frontend | `npm run lint` | Run ESLint. |
| Backend | `npm run start:dev` | Start NestJS in watch mode. |
| Backend | `npm run build` | Compile the API. |
| Backend | `npm test` | Run unit tests. |
| Backend | `npm run test:e2e` | Run end-to-end tests. |
| Backend | `npm run test:cov` | Generate a coverage report. |

Run frontend commands from `frontend/` and backend commands from `backend/`.

## Roadmap

- [x] Authentication and organization workspaces
- [x] Datasource connection management and CSV imports
- [x] SQL editor with schema exploration
- [x] Dashboard and widget builders
- [x] Public dashboard sharing
- [ ] Automated CI checks and release builds
- [ ] Expanded automated test coverage
- [ ] Deployment and operations guide

## Contributing

Contributions and constructive feedback are welcome while MetricFlow evolves:

1. Fork the repository and create a focused branch.
2. Keep changes scoped and include tests when behavior changes.
3. Run the relevant lint, build, and test commands.
4. Open a pull request that explains the problem and the chosen approach.

For security-sensitive reports, do not open a public issue. Contact the repository maintainer privately through their GitHub profile.

## License

MetricFlow is open-source software licensed under the [MIT License](LICENSE.md).

---

<div align="center">
  Built to make the path from query to insight feel effortless.
</div>
