# Catálogo de funcionalidades

MetricFlow es un workspace BI self-hosted para analítica SQL, dashboards, reportes programados y acceso gobernado a fuentes de datos. Esta página refleja el estado actual de `main`, incluyendo el hardening de Stage 5 integrado desde `fix/stage5-hardening`.

## Matriz de funcionalidades

| Área | Disponible hoy | Notas |
|---|---|---|
| Instalación | Asistente de setup único | Crea una organización y el primer administrador. Instalaciones existentes usan `/login`. |
| Autenticación | Login JWT, `/auth/me`, cambio de contraseña | El token incluye organización activa, rol y versión de contraseña. |
| Organizaciones | Workspace activo, miembros y roles | Roles: `ADMIN`, `EDITOR`, `READER`. |
| Fuentes de datos | PostgreSQL, MySQL, SQL Server, carga SQLite, carga CSV, BigQuery, Snowflake | SQLite/CSV se crean por carga segura de archivo, no como conexión libre. |
| Editor SQL | Monaco editor, esquema, ejecutar/cancelar/guardar consulta | La ejecución es de solo lectura y queda auditada. |
| Biblioteca de consultas | SQL guardado vinculado a datasource | Alimenta widgets y programaciones. |
| Programaciones | Entrega por cron | Envía CSV, HTML o JSON; si no hay SMTP, registra el envío en consola. |
| Dashboards | Lista/detalle, páginas, edición de layout, widgets | Cada dashboard crea una página `Resumen`. |
| Widgets | Tabla, barras, barras apiladas, línea, pie, KPI, texto/separador/imagen | Soportan layout, chart config, visual config, data config e interaction config. |
| Compartir público | Enlaces públicos y endpoints de datos de widgets | Usa share tokens revocables. |
| Políticas de acceso | Filtros de filas y columnas permitidas por rol | Se configuran para `READER` y `EDITOR`; solo `ADMIN` las actualiza. |
| Auditoría | Endpoint de auditoría reciente | `READER` no puede consultar auditoría. |
| UI | Tema claro/oscuro, español/inglés, ruta de documentación | Preferencias guardadas en local storage. |
| Release checks | Scripts locales y workflow pre-release | Integración TestSprite disponible por scripts del repo. |

## Roles de usuario

| Rol | Capacidades previstas |
|---|---|
| `ADMIN` | Administra usuarios, configuración, datasources, políticas, contenido, auditoría y sharing. |
| `EDITOR` | Crea contenido analítico, administra datasources, ejecuta SQL de lectura y construye dashboards/widgets. |
| `READER` | Consume contenido publicado y lecturas gobernadas desde dashboards. No administra políticas ni auditoría. |

## Fuentes de datos

| Tipo | Campos de configuración |
|---|---|
| PostgreSQL / MySQL | `host`, `port`, `username`, `password`, `database`, `ssl` opcional. |
| SQL Server | `host`, `port`, `username`, `password`, `database`, `schema` opcional, `ssl` opcional. |
| SQLite | Archivo subido y almacenado por organización. |
| CSV | Archivo subido e importado a SQLite por organización. |
| BigQuery | `projectId`, dataset en `database`, `serviceAccountJson` cifrado. |
| Snowflake | `account`, `username`, `password`, `database`, `warehouse`, `schema` opcional. |

Las contraseñas y service accounts se cifran antes de persistir. Las respuestas API enmascaran campos sensibles.

## Ejecución SQL

- Las consultas pasan por la política SQL de solo lectura.
- Timeout de ejecución: 30 segundos.
- Usuarios pueden cancelar ejecuciones activas.
- Hay rutas de ejecución para PostgreSQL, MySQL, SQL Server, SQLite/CSV, BigQuery y Snowflake.
- Las ejecuciones registran SQL, usuario, duración, filas, estado y error.
- Los widgets de dashboard usan el mismo servicio de consultas para mantener políticas por rol.

## Dashboard Studio

Dashboard Studio soporta dashboards multipágina y widgets configurables:

- Página por defecto: `Resumen`.
- Widgets asociados a página mediante `pageId`.
- Persistencia de layout con `layoutX`, `layoutY`, `layoutW`, `layoutH`.
- Widgets narrativos mediante `visualConfig`, `dataConfig` e `interactionConfig`.
- Respuestas seguras para lectores sin exponer SQL interno.

## Dashboards públicos

| Concepto | Campo | Comportamiento |
|---|---|---|
| Publicación interna | `publishedAt` | Controla lo visible para `READER` dentro de la app. |
| Sharing público | `isPublic` + `shareToken` | Habilita acceso sin autenticación por token. |

Desactivar sharing público limpia el token.

## Programaciones y reportes por email

Las programaciones se revisan cada minuto y ejecutan trabajos vencidos. Cada programación guarda historial con estado, error y destinatarios.

Formatos soportados:

- `csv`
- `html`
- `json`

Si SMTP no está configurado, los reportes se registran en consola.

## Brechas actuales de roadmap

Aún son roadmap, no funcionalidades completas:

- SAML / SSO.
- Gestión SCIM de ciclo de vida.
- Orquestación completa de refresh de datasets.
- Caché de resultados e invalidación.
- Exportación Excel, PDF e imágenes.
- Drill-down/drill-through e interacciones cruzadas entre widgets.
- Publicación versionada y rollback de dashboards.
- SDK de plugins/conectores.

## Siguiente paso

Configura la aplicación con [Configuración](./configuracion.md), o revisa [Seguridad y hardening](./seguridad-hardening.md).
