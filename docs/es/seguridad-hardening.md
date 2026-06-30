# Seguridad y hardening

MetricFlow maneja credenciales de bases de datos, resultados de queries, enlaces públicos de dashboards y controles de acceso. Esta página resume las protecciones implementadas hoy, incluyendo Stage 5 hardening.

## Instalación y secretos

- `JWT_SECRET` es obligatorio.
- `ENCRYPTION_KEY` es obligatorio.
- `JWT_SECRET` y `ENCRYPTION_KEY` deben ser diferentes.
- No se deben commitear archivos `.env`.
- Passwords de datasources y JSON de service accounts BigQuery se cifran antes de persistir.

## Autenticación e invalidación de sesión

- Login firma JWTs con user id, email, organización activa, rol y versión de contraseña.
- Usuarios desactivados no pueden iniciar sesión.
- Usuarios nuevos/reseteados pueden forzarse con `mustChangePassword`.
- Cambios de contraseña incrementan `passwordVersion`, invalidando tokens antiguos cuando los guards comparan versión del token con estado actual.
- El API client del frontend limpia local storage ante respuestas `401`.

## Límites de tenant y rol

- Rutas protegidas usan `JwtAuthGuard` y `TenantGuard`.
- El contexto de tenant viene del header de organización activa o del JWT como fallback.
- Datasources, queries, dashboards, widgets, schedules, organización y auditoría se filtran por organización.
- Role guard protege creación/test/upload/delete de datasources y actualización de políticas.
- `READER` no puede leer auditoría.

## Políticas de datasource

Admins pueden configurar políticas por rol para `READER` y `EDITOR`:

| Política | Comportamiento |
|---|---|
| `allowedColumns` | Restringe columnas visibles para el rol. `null` significa sin restricción. |
| `rowFilter` | Aplica filtro SQL de filas para el rol. `null` significa sin restricción. |

Estas políticas viven en el datasource y se aplican en rutas de ejecución que leen la configuración del datasource.

## SQL de solo lectura

El query engine pasa SQL por `SqlReadOnlyPolicy` antes de ejecutar. Stage 5 amplió cobertura alrededor de conectores y manejo de queries inseguras.

Protecciones implementadas:

- Rechazo de tipos de datasource no soportados.
- Normalización y validación SQL antes de ejecutar.
- Prevención de múltiples sentencias destructivas como lectura analítica.
- Ejecución dedicada por driver: PostgreSQL, MySQL, SQL Server, SQLite/CSV, BigQuery, Snowflake.
- Timeout de 30 segundos.
- Cancelación por usuario mediante execution id.
- Registro de estado y errores de ejecución.

## Hardening de SQL Server

SQL Server incluye:

- Manejo de pools de conexión.
- Filtro opcional de schema para discovery.
- Preparación de solo lectura con la política SQL común.
- Tests de manejo read-only y comportamiento del conector.

## Seguridad de dashboards públicos

- Dashboards públicos usan `shareToken` separado.
- Lecturas públicas requieren `isPublic = true`.
- Desactivar acceso público limpia el token.
- Vistas públicas se auditan como `DASHBOARD_PUBLIC_VIEWED`.
- Datos de widgets públicos corren con semántica `READER`.

## Cobertura de auditoría

Se registran eventos importantes como:

- Publicar/retirar dashboards.
- Vistas públicas de dashboard.
- Crear/actualizar/eliminar schedules.
- Resultados de ejecución de schedules.

El endpoint de auditoría limita resultados entre 1 y 200 registros.

## Seguridad de reportes programados

- Los schedules deben pertenecer a la organización actual.
- Expresiones cron se parsean y validan antes de persistir.
- Historial guarda éxito/error y destinatarios.
- SMTP es opcional; sin SMTP se usa mock en consola.

## Seguridad de documentación pública

El directorio `/docs` está pensado para publicarse con GitHub Pages. No pongas secretos, capturas privadas, datos de clientes, dumps de DB ni resultados de queries allí.

## Siguiente paso

Usa [Configuración](./configuracion.md) para definir secretos y SMTP correctamente.
