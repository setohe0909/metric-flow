<p align="center">
  <img src="docs/logo.png" alt="MetricFlow Logo" width="160" />
</p>

<h1 align="center">MetricFlow</h1>

<p align="center">
  <strong>Self-hosted SQL analytics &amp; dashboard platform for data-driven teams.</strong><br/>
  Connect your databases, write SQL, visualize results, and share dashboards — all in one place.
</p>

<p align="center">
  <a href="https://github.com/setohe0909/metric-flow/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-f7a501?style=flat-square&labelColor=23251d" alt="License: MIT" />
  </a>
  <a href="https://github.com/setohe0909/metric-flow">
    <img src="https://img.shields.io/badge/version-0.1.0--alpha-f7a501?style=flat-square&labelColor=23251d" alt="Version" />
  </a>
  <img src="https://img.shields.io/badge/NestJS-11-f7a501?style=flat-square&labelColor=23251d&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-19-f7a501?style=flat-square&labelColor=23251d&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6-f7a501?style=flat-square&labelColor=23251d&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-f7a501?style=flat-square&labelColor=23251d&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PRs-welcome-f7a501?style=flat-square&labelColor=23251d" alt="PRs Welcome" />
</p>

---

## ✨ What is MetricFlow?

**MetricFlow** is a self-hosted, open-source business intelligence platform that lets you:

- 🔌 **Connect** to PostgreSQL and MySQL for officially supported query execution
- 🧠 **Write SQL** in a rich Monaco editor with live query execution
- 📊 **Build charts** — bar, line, pie, KPI cards, and data tables
- 🗂️ **Compose dashboards** with drag-and-drop widget layouts
- 🔗 **Share and Embed** dashboards publicly via secure share tokens and customizable `<iframe>` snippets
- 🛡️ **Granular Access Control** — row-level filters and column-level permission masks per role (admin / viewer)
- 🏢 **Multi-tenant** — organizations, members, and role-based access (owner / admin / viewer)
- 🔐 **Secure** — AES-256 encrypted datasource credentials, JWT authentication

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 5, TypeScript, TailwindCSS v4 |
| **State / Data** | TanStack Query v5, Zustand v5 |
| **Charts** | Recharts v3 |
| **SQL Editor** | Monaco Editor |
| **Backend** | NestJS 11, TypeScript |
| **ORM** | Prisma 6 |
| **Database** | PostgreSQL 15 (primary store) |
| **Auth** | JWT + Passport.js, bcrypt |
| **Drivers** | `pg`, `mysql2`, `sqlite3`, `csv-parse`, `@google-cloud/bigquery`, `snowflake-sdk` |
| **Infra** | Docker Compose |

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React 19)                │
│  Login · Signup · Datasources · SQL Editor ·        │
│  Query Library · Dashboard Builder · Widget Creator │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼────────────────────────────┐
│                 NestJS API (port 3000)               │
│  auth · organizations · datasource · queries ·      │
│  query-engine · dashboard · widget                  │
└──────┬─────────────────────────────┬────────────────┘
       │ Prisma ORM                  │ Driver per datasource
       ▼                             ▼
  PostgreSQL 15             PostgreSQL / MySQL /
  (metadata store)          SQLite / CSV (user data)
```

### Key Design Decisions

- **Multi-tenancy via Organizations** — every resource (datasource, query, dashboard, widget, execution log) is scoped to an `Organization`. Users join orgs with a `Role` (owner | admin | viewer).
- **Encrypted credentials** — datasource connection strings are stored AES-256 encrypted at rest; never exposed through the API.
- **Query Engine** — a dedicated `query-engine` module proxies SQL execution against user datasources and returns typed `{ columns, rows }` payloads.
- **Execution Audit Log** — every SQL run is recorded in the `executions` table (query, user, duration, row count, status).
- **Public dashboard sharing** — dashboards can be toggled public and accessed via a unique `shareToken` without authentication.

---

## 🗄️ Data Model

```
Organization ──< Membership >── User
     │
     ├──< Datasource
     │
     ├──< Query ──────────────────< Execution
     │       └──< Widget
     │
     └──< Dashboard ──< Widget
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **Docker** & Docker Compose (for the local PostgreSQL instance)
- **npm** ≥ 10

### 1. Clone the repository

```bash
git clone https://github.com/setohe0909/metric-flow.git
cd metric-flow
```

### 2. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL 15 instance on port **5432** with database `metricflow`.

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` — minimum required variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metricflow"
JWT_SECRET="your-super-secret-jwt-key"
ENCRYPTION_KEY="32-char-hex-key-for-aes-256"
PORT=3000
```

`JWT_SECRET` and `ENCRYPTION_KEY` are mandatory, must be different, and do not
have fallback values. Generate independent random values before starting the
backend.

### 4. Install & migrate

```bash
# Inside backend/
npm install
npx prisma migrate deploy
npx prisma generate
```

### 5. Start the backend

```bash
npm run start:dev
# API available at http://localhost:3000
```

### 6. Start the frontend

```bash
cd ../frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## 📁 Project Structure

```
metric-flow/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/             # JWT auth, login, register
│   │   ├── organizations/    # Org management & membership
│   │   ├── datasource/       # Datasource CRUD + connection test
│   │   ├── query-engine/     # Proxy SQL execution against user DBs
│   │   ├── queries/          # Saved query library
│   │   ├── dashboard/        # Dashboard CRUD + public sharing
│   │   ├── widget/           # Widget CRUD + layout persistence
│   │   └── common/           # Guards, decorators, pipes
│   └── prisma/
│       └── schema.prisma     # Full data model
│
├── frontend/                 # React 19 + Vite SPA
│   └── src/
│       ├── features/         # Feature modules (auth, dashboards, widgets…)
│       ├── pages/            # Route-level page components
│       ├── components/       # Shared UI components
│       ├── layouts/          # App shell & nav layout
│       └── store/            # Zustand global stores
│
├── docker-compose.yml        # Local PostgreSQL service
└── docs/
    └── logo.png
```

---

## 🧪 Running Tests

### Backend

```bash
cd backend
npm run lint          # ESLint
npm run build         # TypeScript build check
npm test              # Unit tests (Jest)
npm run test:e2e      # End-to-end tests
npm run test:cov      # Coverage report
```

### Frontend

```bash
cd frontend
npm run lint          # ESLint
npm run build         # Vite production build
```

---

## 🔒 Security Notes

- Datasource passwords and connection strings are **AES-256 encrypted** before being stored in PostgreSQL.
- JWT tokens are signed with the mandatory `JWT_SECRET`.
- Datasource credentials use the mandatory, independent `ENCRYPTION_KEY`.
- PostgreSQL and MySQL queries are parsed and executed in read-only transactions.
- The `viewer` role is **read-only** — viewers cannot create or modify queries, datasources, or dashboards.
- Public dashboard share tokens are UUID-based and revocable by the dashboard owner.
- Never commit your `.env` file. It is listed in `.gitignore` by default.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add X"`
4. Push to your fork: `git push origin feat/my-feature`
5. Open a Pull Request — describe what changed and why

Please read [`AGENTS.md`](./backend/AGENTS.md) for our working agreements and validation checklist before submitting a PR.

### Reporting Bugs

Open an [issue](https://github.com/setohe0909/metric-flow/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- MetricFlow version and OS

---

## 🗺️ Roadmap

- [x] Role-based column/row filtering per datasource
- [ ] Scheduled query execution & email delivery
- [x] Dashboard embed via `<iframe>` snippet
- [x] BigQuery and Snowflake drivers
- [ ] SAML / SSO integration
- [ ] Dark mode toggle in the UI

---

## 📄 License

MetricFlow is released under the [MIT License](LICENSE).

---

<p align="center">
  Built with ☕ and SQL by the MetricFlow team.
</p>
