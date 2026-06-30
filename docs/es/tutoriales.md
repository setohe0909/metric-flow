# Tutoriales

Estas guías explican el flujo central de MetricFlow: configurar un espacio, conectar datos, ejecutar SQL, crear visualizaciones y compartir dashboards.

## Tutorial 1: Crear el primer espacio de trabajo

Úsalo en una instalación nueva.

1. Inicia backend y frontend siguiendo [Primeros pasos](./primeros-pasos.md).
2. Abre `http://localhost:5173/setup`.
3. Ingresa el nombre de la organización y los datos de la cuenta propietaria.
4. Envía el formulario.
5. Inicia sesión con la cuenta propietaria.

Resultado esperado: la instalación queda inicializada y las próximas visitas deben usar `/login`.

## Tutorial 2: Conectar una fuente de datos

1. Inicia sesión como administrador o editor.
2. Abre **Datasources** o **Fuentes de datos**.
3. Elige el tipo de fuente.
4. Ingresa los datos de conexión.
5. Haz clic en **Test connection** antes de guardar.
6. Guarda la fuente solo cuando la prueba sea exitosa.

Notas de seguridad:

- Usa credenciales de base de datos con privilegios mínimos.
- Prefiere usuarios de solo lectura para conexiones analíticas.
- No pegues credenciales productivas en capturas o reportes de bugs.

## Tutorial 3: Ejecutar y guardar una consulta

1. Abre el editor SQL.
2. Selecciona una fuente de datos.
3. Escribe una consulta SQL de solo lectura.
4. Ejecuta la consulta y revisa columnas y filas.
5. Guarda la consulta con un nombre y descripción claros.

Patrón recomendado de nombres:

| Nombre de consulta | Útil cuando |
|---|---|
| `weekly_revenue_by_region` | La consulta produce una métrica de negocio reutilizable. |
| `active_users_last_30_days` | La consulta está acotada a una ventana común de reporte. |

## Tutorial 4: Construir y compartir un dashboard

1. Crea o abre un dashboard.
2. Agrega un widget desde una consulta guardada.
3. Elige un tipo de gráfico como barra, línea, pie, KPI o tabla.
4. Ordena los widgets en un layout legible.
5. Guarda el dashboard.
6. Si corresponde compartirlo públicamente, habilita el enlace público y copia el link o snippet de embed.

Checklist antes de compartir:

- Confirma que el dashboard no exponga filas, columnas o identificadores sensibles.
- Revisa las políticas de filas y columnas de la fuente de datos.
- Desactiva el acceso público cuando el enlace ya no sea necesario.

## Tutorial 5: Invitar usuarios y asignar roles

1. Inicia sesión como administrador.
2. Abre configuración de usuarios u organización.
3. Crea o invita al usuario.
4. Asigna el rol mínimo que necesita para su trabajo.

| Rol | Uso típico |
|---|---|
| Admin | Administra usuarios, fuentes, configuración y contenido. |
| Editor | Crea fuentes, consultas, widgets y dashboards. |
| Reader | Consume contenido analítico publicado. |

## Tutorial 6: Validar un cambio de comunidad

Antes de abrir un pull request:

```bash
cd backend
npm run lint
npm run build
npm test

cd ../frontend
npm run lint
npm run build
```

Si cambiaste comportamiento de API, autenticación, persistencia o integración entre módulos, ejecuta también las pruebas end-to-end del backend:

```bash
cd backend
npm run test:e2e
```

## Tutorial 7: Configurar políticas de datasource

Úsalo cuando distintos roles deban ver distintas filas o columnas.

1. Inicia sesión como administrador.
2. Abre **Datasources** o **Fuentes de datos** y selecciona la fuente.
3. Abre el editor de políticas de acceso.
4. Configura políticas para `READER` y/o `EDITOR`.
5. Usa `allowedColumns` para restringir columnas visibles.
6. Usa `rowFilter` para restringir filas, por ejemplo `region = 'LATAM'`.
7. Guarda la política y verifica el resultado con un usuario de menor privilegio.

Checklist de políticas:

- Empieza con la restricción mínima útil.
- Prueba dashboards y consultas guardadas representativas.
- No uses filtros de fila como reemplazo de permisos mínimos en la base de datos.

## Tutorial 8: Programar un reporte de consulta

1. Guarda una consulta con un nombre claro.
2. Abre **Programar envío** desde el editor SQL.
3. Agrega uno o más destinatarios de email.
4. Elige frecuencia o define una expresión cron personalizada.
5. Elige `csv`, `html` o `json`.
6. Guarda la programación.
7. Revisa el historial después de la ejecución.

Si SMTP no está configurado, MetricFlow registra el contenido del reporte en la consola del backend en vez de enviar email.

## Tutorial 9: Revisar auditoría y señales de hardening

1. Inicia sesión como administrador o editor.
2. Usa auditoría para revisar publicación de dashboards, vistas públicas y cambios de schedules.
3. Investiga ejecuciones fallidas con estado, mensaje de error e historial de programación.
4. Revoca sharing público cuando un link ya no deba estar accesible.

Checklist de seguridad:

- Los links públicos de dashboard son intencionales y vigentes.
- Las políticas de datasource coinciden con los roles.
- Los destinatarios programados siguen siendo válidos.
- Los secretos viven solo en variables de entorno o settings cifrados de datasource.

## Siguiente paso

Lee el [catálogo de funcionalidades](./funcionalidades.md), la [configuración](./configuracion.md) y la guía de [seguridad y hardening](./seguridad-hardening.md) antes de abrir un issue o pull request.
