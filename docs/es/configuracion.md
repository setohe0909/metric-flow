# Referencia de configuración

Esta página lista la configuración de runtime y estado local usado por MetricFlow. Los secretos requeridos deben definirse antes de iniciar el backend.

## Variables de entorno del backend

| Variable | Requerida | Propósito | Notas |
|---|---:|---|---|
| `DATABASE_URL` | Sí | URL de PostgreSQL para metadatos | La usa Prisma. Ejemplo: `postgresql://postgres:postgres@localhost:5432/metricflow`. |
| `JWT_SECRET` | Sí | Firma tokens de autenticación | Debe existir y no estar vacío. No reutilizar `ENCRYPTION_KEY`. |
| `ENCRYPTION_KEY` | Sí | Cifra credenciales de datasources | Debe existir y no estar vacío. No reutilizar `JWT_SECRET`. |
| `PORT` | No | Puerto de la API | Por defecto `3000`. |
| `SMTP_HOST` | No | Host SMTP | Requerido para envío real de emails. |
| `SMTP_PORT` | No | Puerto SMTP | Por defecto `587`; puerto `465` usa transporte seguro. |
| `SMTP_USER` | No | Usuario SMTP | Requerido junto con `SMTP_HOST` y `SMTP_PASS`. |
| `SMTP_PASS` | No | Password SMTP | Requerido junto con `SMTP_HOST` y `SMTP_USER`. |
| `SMTP_FROM` | No | Remitente de reportes | Por defecto `"MetricFlow Reports" <noreply@metricflow.io>`. |

Si SMTP no está completo, los reportes programados se escriben en logs del backend en modo mock.

## `.env` mínimo del backend

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metricflow"
JWT_SECRET="reemplaza-con-un-secreto-largo-y-aleatorio"
ENCRYPTION_KEY="reemplaza-con-un-secreto-distinto-y-aleatorio"
PORT=3000
```

## Configuración opcional de email

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="reports@example.com"
SMTP_PASS="reemplaza-con-password-smtp"
SMTP_FROM="MetricFlow Reports <reports@example.com>"
```

## Servicios y puertos locales

| Servicio | Puerto por defecto | Comando |
|---|---:|---|
| PostgreSQL de metadatos | `5432` | `docker compose up -d` |
| API NestJS | `3000` | `cd backend && npm run start:dev` |
| Frontend React/Vite | `5173` | `cd frontend && npm run dev` |

## Instalación y migraciones

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

## Local storage del frontend

| Key | Propósito |
|---|---|
| `metricflow_token` | JWT usado por el API client. Se limpia en logout o `401`. |
| `metricflow_active_org_id` | Fuente del header de organización activa. |
| `metricflow_locale` | Preferencia de idioma: `es` o `en`. |
| `metricflow_theme` | Preferencia de tema: `light` o `dark`. |

## Configuración de datasources

| Datasource | Settings requeridos |
|---|---|
| PostgreSQL | host, port, username, password, database; SSL opcional. |
| MySQL | host, port, username, password, database; SSL opcional. |
| SQL Server | host, port, username, password, database; schema y SSL opcionales. |
| SQLite | Cargar archivo SQLite desde UI/endpoint. |
| CSV | Cargar CSV; MetricFlow lo importa a SQLite por organización. |
| BigQuery | project ID, dataset/database, service account JSON. |
| Snowflake | account, username, password, database, warehouse, schema opcional. |

## Configuración de release y verificación

Scripts raíz:

```bash
npm run test:release-tools
npm run release:test:testsprite
npm run release:check
```

TestSprite requiere:

| Variable | Dónde |
|---|---|
| `TESTSPRITE_API_KEY` | Entorno local y secret de GitHub Actions. |
| `TESTSPRITE_PROJECT_ID` | Entorno local y variable de repositorio en GitHub Actions. |

## Comandos de validación

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

## Siguiente paso

Revisa el [Catálogo de funcionalidades](./funcionalidades.md) para entender qué habilita cada configuración.
