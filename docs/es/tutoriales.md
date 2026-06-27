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

## Siguiente paso

Lee la guía para [contribuir](./contribuir.md) antes de abrir un issue o pull request.
