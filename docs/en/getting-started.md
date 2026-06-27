# Getting Started

This guide gets MetricFlow running locally for development or evaluation.

## Prerequisites

| Tool | Version / purpose |
|---|---|
| Node.js | 20 or newer |
| npm | 10 or newer |
| Docker Compose | Runs the local PostgreSQL metadata database |
| Git | Clones the repository |

## 1. Clone the repository

```bash
git clone https://github.com/setohe0909/metric-flow.git
cd metric-flow
```

## 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts the local metadata database used by MetricFlow.

## 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set at least:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metricflow"
JWT_SECRET="replace-with-a-long-random-secret"
ENCRYPTION_KEY="replace-with-a-32-byte-compatible-secret"
PORT=3000
```

Security checklist:

- Use different values for `JWT_SECRET` and `ENCRYPTION_KEY`.
- Never commit `.env` files.
- Rotate secrets before using a shared or production installation.

## 4. Install dependencies and prepare Prisma

```bash
npm install
npx prisma migrate deploy
npx prisma generate
```

## 5. Start the API

```bash
npm run start:dev
```

The API should be available at `http://localhost:3000`.

## 6. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app should be available at `http://localhost:5173`.

## 7. Create the first workspace

Open `http://localhost:5173/setup` and create the first organization owner. After setup, existing installations use `http://localhost:5173/login`.

## Troubleshooting

| Symptom | What to check |
|---|---|
| Setup says the installation is already initialized | Open `/login`; the one-time setup flow only runs once. |
| Backend cannot connect to PostgreSQL | Confirm `docker compose ps` shows PostgreSQL running and `DATABASE_URL` matches the compose credentials. |
| Login fails after restart | Confirm the backend is running and using the same database and secrets as the setup run. |
| Prisma client errors | Re-run `npx prisma generate` inside `backend/`. |

## Next step

Continue with the [tutorials](./tutorials.md).
