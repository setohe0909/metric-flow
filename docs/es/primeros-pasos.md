# Primeros pasos

Esta guía deja MetricFlow funcionando localmente para desarrollo o evaluación.

## Requisitos

| Herramienta | Versión / propósito |
|---|---|
| Node.js | 20 o superior |
| npm | 10 o superior |
| Docker Compose | Ejecuta PostgreSQL local para metadatos |
| Git | Clona el repositorio |

## 1. Clonar el repositorio

```bash
git clone https://github.com/setohe0909/metric-flow.git
cd metric-flow
```

## 2. Iniciar PostgreSQL

```bash
docker compose up -d
```

Esto inicia la base local de metadatos que usa MetricFlow.

## 3. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` y define como mínimo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metricflow"
JWT_SECRET="reemplaza-con-un-secreto-largo-y-aleatorio"
ENCRYPTION_KEY="reemplaza-con-un-secreto-compatible-con-32-bytes"
PORT=3000
```

Checklist de seguridad:

- Usa valores diferentes para `JWT_SECRET` y `ENCRYPTION_KEY`.
- Nunca subas archivos `.env` al repositorio.
- Rota los secretos antes de usar una instalación compartida o productiva.

## 4. Instalar dependencias y preparar Prisma

```bash
npm install
npx prisma migrate deploy
npx prisma generate
```

## 5. Iniciar la API

```bash
npm run start:dev
```

La API debería estar disponible en `http://localhost:3000`.

## 6. Iniciar el frontend

Abre una segunda terminal:

```bash
cd frontend
npm install
npm run dev
```

La app debería estar disponible en `http://localhost:5173`.

## 7. Crear el primer espacio de trabajo

Abre `http://localhost:5173/setup` y crea la primera cuenta propietaria de la organización. Después del setup, las instalaciones existentes usan `http://localhost:5173/login`.

## Solución de problemas

| Síntoma | Qué revisar |
|---|---|
| Setup indica que la instalación ya está inicializada | Abre `/login`; el setup inicial solo se ejecuta una vez. |
| El backend no conecta con PostgreSQL | Confirma que `docker compose ps` muestre PostgreSQL activo y que `DATABASE_URL` coincida con las credenciales del compose. |
| El login falla después de reiniciar | Confirma que el backend use la misma base y los mismos secretos que se usaron durante el setup. |
| Errores de Prisma Client | Ejecuta de nuevo `npx prisma generate` dentro de `backend/`. |

## Siguiente paso

Continúa con los [tutoriales](./tutoriales.md).
