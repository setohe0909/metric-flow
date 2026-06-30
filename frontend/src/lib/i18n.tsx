/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Locale = 'es' | 'en';

type TranslationMap = Record<string, string>;

const SUPPORTED_LOCALES: Locale[] = ['es', 'en'];
const LOCALE_STORAGE_KEY = 'metricflow_locale';

const EN_TRANSLATIONS: TranslationMap = {
  'Dashboards': 'Dashboards',
  'SQL Editor': 'SQL Editor',
  'Conectores': 'Connectors',
  'Ajustes': 'Settings',
  'Cerrar Sesión': 'Sign out',
  'Cargando MetricFlow...': 'Loading MetricFlow...',
  'Comprobando instalación': 'Checking installation',
  'No fue posible consultar el estado de la instalación.': 'Could not check the installation status.',
  'No fue posible consultar el estado de la instalación. Verifica que el backend esté disponible.': 'Could not check the installation status. Verify that the backend is available.',
  'Configurar MetricFlow': 'Set up MetricFlow',
  'Crea la organización y el primer administrador de esta instalación.': 'Create the organization and first administrator for this installation.',
  'Nombre': 'First name',
  'Apellido': 'Last name',
  'Organización': 'Organization',
  'Correo del administrador': 'Administrator email',
  'Contraseña': 'Password',
  'Crear instalación': 'Create installation',
  'No fue posible configurar la instalación.': 'Could not set up the installation.',
  'Inicia sesión en tu cuenta': 'Sign in to your account',
  'Acceso para usuarios de esta instalación.': 'Access for users in this installation.',
  'Correo Electrónico': 'Email',
  'Error de inicio de sesión. Revisa tus datos.': 'Sign-in error. Check your credentials.',
  'Iniciar Sesión': 'Sign in',
  'Cambia tu contraseña': 'Change your password',
  'La contraseña temporal debe reemplazarse antes de continuar.': 'The temporary password must be replaced before continuing.',
  'Contraseña temporal': 'Temporary password',
  'Nueva contraseña': 'New password',
  'No fue posible cambiar la contraseña.': 'Could not change the password.',
  'Guardar nueva contraseña': 'Save new password',
  'Crea y administra tableros de control para tu equipo.': 'Create and manage dashboards for your team.',
  'Nuevo Dashboard': 'New Dashboard',
  'No hay dashboards creados': 'No dashboards created',
  'Comienza conectando tu base de datos en la sección de Conectores, guarda tu primera query y construye tu tablero.': 'Start by connecting your database in Connectors, save your first query, and build your dashboard.',
  'Crear mi primer dashboard': 'Create my first dashboard',
  'Eliminar dashboard': 'Delete dashboard',
  'Ver Tablero': 'View Dashboard',
  'Un dashboard organiza múltiples widgets interactivos alimentados por tus bases de datos.': 'A dashboard organizes multiple interactive widgets powered by your databases.',
  'Nombre del Dashboard': 'Dashboard name',
  'Descripción (Opcional)': 'Description (Optional)',
  'Cancelar': 'Cancel',
  'Crear Dashboard': 'Create Dashboard',
  'Error al crear el dashboard.': 'Error creating the dashboard.',
  'Error al eliminar el dashboard.': 'Error deleting the dashboard.',
  'Error al cargar el dashboard': 'Error loading dashboard',
  'Asegúrate de tener acceso o que el dashboard exista.': 'Make sure you have access or that the dashboard exists.',
  'Volver a Dashboards': 'Back to Dashboards',
  'Compartir': 'Share',
  'Enlace': 'Link',
  'Embed': 'Embed',
  'Copiado': 'Copied',
  'Copiar': 'Copy',
  'Guardar': 'Save',
  'Guardar Cambios': 'Save Changes',
  'Editar diseño': 'Edit layout',
  'Salir de edición': 'Exit editing',
  'Agregar gráfico': 'Add chart',
  'No hay widgets en este dashboard': 'There are no widgets in this dashboard',
  'Conecta datos o agrega contenido para comenzar a construir tu vista.': 'Connect data or add content to start building your view.',
  'Secciones del dashboard': 'Dashboard sections',
  'Próximamente: crear sección': 'Coming soon: create section',
  'Texto': 'Text',
  'Insights, notas y storytelling': 'Insights, notes, and storytelling',
  'Separador': 'Divider',
  'Divide secciones visuales': 'Divide visual sections',
  'Imagen': 'Image',
  'Logos, banners y contexto': 'Logos, banners, and context',
  'Selecciona un widget': 'Select a widget',
  'Edita el contenido, título o configuración visual desde este panel.': 'Edit content, title, or visual configuration from this panel.',
  'Título': 'Title',
  'Texto / Markdown': 'Text / Markdown',
  'URL de imagen': 'Image URL',
  'Eliminar widget': 'Delete widget',
  'Error de Renderizado': 'Render Error',
  'Ejes o datos no válidos para este gráfico.': 'Invalid axes or data for this chart.',
  'Fuentes de Datos': 'Data Sources',
  'Conecta y administra las fuentes disponibles para tus consultas.': 'Connect and manage the sources available for your queries.',
  'Nueva Fuente': 'New Source',
  'No hay fuentes conectadas': 'No connected sources',
  'Conecta tu primera fuente para comenzar a consultar datos.': 'Connect your first source to start querying data.',
  'Nombre de la Conexión': 'Connection name',
  'Tipo de Base de Datos': 'Database type',
  'Servidor / Host': 'Server / Host',
  'Puerto': 'Port',
  'Usuario': 'User',
  'Base de Datos': 'Database',
  'Usar SSL': 'Use SSL',
  'Ruta del archivo': 'File path',
  'Probar Conexión': 'Test Connection',
  'Guardar Fuente': 'Save Source',
  'Selecciona un archivo': 'Select a file',
  'Arrastra y suelta un archivo aquí': 'Drag and drop a file here',
  'Error al guardar la fuente de datos.': 'Error saving the data source.',
  'Debes seleccionar un archivo antes de guardar.': 'You must select a file before saving.',
  'Consultas SQL': 'SQL Queries',
  'Escribe, ejecuta y guarda consultas para alimentar widgets y dashboards.': 'Write, run, and save queries to power widgets and dashboards.',
  'Ejecutar': 'Run',
  'Ejecutando': 'Running',
  'Cancelar ejecución': 'Cancel execution',
  'Guardar Query': 'Save Query',
  'Queries': 'Queries',
  'Esquema': 'Schema',
  'Resultados': 'Results',
  'Sin resultados': 'No results',
  'Guardar consulta': 'Save query',
  'Nombre de la consulta': 'Query name',
  'Descripción': 'Description',
  'Programar envío': 'Schedule delivery',
  'Debe ingresar al menos un correo electrónico.': 'Enter at least one email address.',
  'Error al guardar la programación.': 'Error saving the schedule.',
  'Error al cambiar el estado de la programación.': 'Error changing the schedule status.',
  'Error al eliminar la programación.': 'Error deleting the schedule.',
  'Programaciones': 'Schedules',
  'Nueva programación': 'New schedule',
  'Destinatarios': 'Recipients',
  'Asunto': 'Subject',
  'Frecuencia': 'Frequency',
  'Diaria': 'Daily',
  'Semanal': 'Weekly',
  'Mensual': 'Monthly',
  'Personalizada': 'Custom',
  'Formato': 'Format',
  'CSV Adjunto': 'CSV Attachment',
  'Tabla HTML': 'HTML Table',
  'JSON Adjunto': 'JSON Attachment',
  'Historial': 'History',
  'Éxito': 'Success',
  'Fallo': 'Failed',
  'Crear Widget': 'Create Widget',
  'Configura la visualización para este dashboard.': 'Configure the visualization for this dashboard.',
  'Tipo de visualización': 'Visualization type',
  'Consulta origen': 'Source query',
  'Vista previa': 'Preview',
  'Columna de Valor KPI': 'KPI Value Column',
  'Etiqueta KPI': 'KPI Label',
  'Eje X': 'X Axis',
  'Eje Y': 'Y Axis',
  'Color': 'Color',
  '¡Widget agregado correctamente!': 'Widget added successfully!',
  'Error al guardar el widget.': 'Error saving the widget.',
  'Barras': 'Bars',
  'Apiladas': 'Stacked',
  'Líneas': 'Lines',
  'Tarta': 'Pie',
  'Tabla': 'Table',
  'Administra tu organización, roles e invita a miembros del equipo.': 'Manage your organization, roles, and invite team members.',
  'Cargando configuración...': 'Loading settings...',
  'Perfil de la Organización': 'Organization Profile',
  'Nombre comercial': 'Business name',
  'Identificador (Slug)': 'Identifier (Slug)',
  'Identificador interno del workspace.': 'Internal workspace identifier.',
  'Nombre actualizado con éxito.': 'Name updated successfully.',
  'Error al actualizar el nombre.': 'Error updating the name.',
  'Invitar Miembro': 'Invite Member',
  'Rol Asignado': 'Assigned Role',
  'Enviar Invitación': 'Send Invitation',
  'Miembros': 'Members',
  'Administrador': 'Administrator',
  'Editor': 'Editor',
  'Lector': 'Reader',
  'Remover miembro': 'Remove member',
  'Error al enviar la invitación.': 'Error sending the invitation.',
  'Error al remover al miembro.': 'Error removing the member.',




  'Abre el creador con consultas, ejes y colores': 'Open the creator with queries, axes, and colors',
  'usuario': 'user',
  'Usuarios que crean contenido y ejecutan consultas de lectura.': 'Users who create content and run read queries.',
  'El nombre del conector es obligatorio.': 'The connector name is required.',
  'Por favor selecciona una base de datos conectada.': 'Please select a connected database.',
  'Cancelando consulta...': 'Canceling query...',
  'Creador de Widgets': 'Widget Creator',
  'Crear primer espacio': 'Create first workspace',
  'Conectar datos': 'Connect data',
  'Construir dashboards': 'Build dashboards',
  'Aprende a self-hostear MetricFlow, conectar datos analíticos, construir dashboards con SQL y contribuir de forma segura al proyecto open source.': 'Learn how to self-host MetricFlow, connect analytical data, build SQL-powered dashboards, and contribute safely to the open-source project.',
  'Nunca publiques valores .env, tokens, credenciales, datos de clientes, capturas con secretos ni resultados de queries.': 'Never publish .env values, tokens, credentials, customer data, screenshots with secrets, or query results.',
  'Crear el primer espacio de trabajo': 'Create the first workspace',
  'Usa el setup único para crear la cuenta propietaria de una instalación self-hosted.': 'Use the one-time setup to create the owner account for a self-hosted installation.',
  'Conectar una fuente de datos segura': 'Connect a secure data source',
  'Agrega conexiones analíticas con credenciales mínimas y valídalas antes de guardar.': 'Add analytical connections with minimal credentials and validate them before saving.',
  'Ejecutar y guardar consultas SQL': 'Run and save SQL queries',
  'Ejecuta SQL de solo lectura, revisa resultados y guarda consultas reutilizables.': 'Run read-only SQL, review results, and save reusable queries.',
  'Abre pull requests enfocados, ejecuta validaciones y documenta cambios visibles para usuarios.': 'Open focused pull requests, run validations, and document user-visible changes.',
  'ACTIVO': 'ACTIVE',
  'Activar': 'Activate',
  'Desactivar': 'Deactivate',
  'Programaciones Activas': 'Active Schedules',
  'Publicado': 'Published',
  'Borrador': 'Draft',
  'Publicar': 'Publish',
  'Retirar': 'Unpublish',
  'Compartido': 'Shared',
  'Privado': 'Private',
  'Ancho': 'Width',
  'Alto (px)': 'Height (px)',
  'Compartir dashboards': 'Share dashboards',
  'Publicar docs': 'Publish docs',
  'Publica esta documentación desde la rama principal y la carpeta /docs en Settings → Pages del repositorio.': 'Publish this documentation from the main branch and the /docs folder in the repository Settings → Pages.',
  'Construir y compartir dashboards': 'Build and share dashboards',
  'Compón widgets, revisa campos sensibles y comparte enlaces públicos solo cuando corresponda.': 'Compose widgets, review sensitive fields, and share public links only when appropriate.',
  'ej. Usuarios Activos Diarios': 'e.g. Daily Active Users',
  'Reactivar usuario': 'Reactivate user',
  'Desactivar usuario': 'Deactivate user',
  'ej. Usuarios Activos': 'e.g. Active Users',
  'Propiedades': 'Properties',
  'Selecciona un widget del canvas para editar su título, contenido o estilo básico.': 'Select a widget from the canvas to edit its title, content, or basic style.',
  'Este widget conserva su configuración avanzada en el creador de widgets.': 'This widget keeps its advanced configuration in the widget creator.',
  'Secciones': 'Sections',
  'Nueva sección': 'New section',
  'Selecciona un widget del canvas para editar sus propiedades.': 'Select a widget from the canvas to edit its properties.',
  'Imagen sin URL': 'Image without URL',
  'Filtro de filas (WHERE)': 'Row filter (WHERE)',
  'Columnas permitidas': 'Allowed columns',
  'Sin columnas = el rol ve todas las columnas del resultado.': 'No columns = the role sees all result columns.',
  'Nueva': 'New',
  'No hay envíos programados para esta consulta.': 'There are no scheduled deliveries for this query.',
  'Nueva Programación': 'New Schedule',
  'Nombre Descriptivo': 'Descriptive Name',
  'Asunto del correo (opcional)': 'Email subject (optional)',
  'Expresión Cron': 'Cron Expression',
  'Historial de Envíos': 'Delivery History',
  'No hay registros de envíos anteriores.': 'There are no previous delivery records.',
  'Configuración de Reportes': 'Report Settings',
  'Puedes automatizar la ejecución de esta consulta SQL y programar su envío de resultados por correo electrónico en formato CSV, JSON o tabla HTML.': 'You can automate this SQL query and schedule its results to be sent by email in CSV, JSON, or HTML table format.',
  'Crear Programación': 'Create Schedule',
  'No hay datos devueltos para esta consulta.': 'No data returned for this query.',
  'Agregar Widget': 'Add Widget',
  'Compartir Dashboard Públicamente': 'Share Dashboard Publicly',
  'Permite que cualquier persona acceda a este dashboard a través de un enlace de solo lectura y marca blanca.': 'Allow anyone to access this dashboard through a read-only, white-label link.',
  'Enlace Público Compartido': 'Shared Public Link',
  'Copiar Enlace': 'Copy Link',
  'Código de Integración (iframe)': 'Embed Code (iframe)',
  'Copiar código embed': 'Copy embed code',
  'Esta sección está vacía': 'This section is empty',
  'Agrega widgets visuales o narrativos para construir esta sección del dashboard.': 'Add visual or narrative widgets to build this dashboard section.',
  'Agregar primer widget': 'Add first widget',
  'Fallo al cargar datos': 'Failed to load data',
  'Cargando dashboard compartido...': 'Loading shared dashboard...',
  'Dashboard no disponible': 'Dashboard unavailable',
  'Este enlace compartido no existe, ha expirado o el dashboard ha sido configurado como privado.': 'This shared link does not exist, has expired, or the dashboard has been set to private.',
  'No hay widgets configurados en esta sección en este momento.': 'There are no widgets configured in this section right now.',
  'Conecta y administra tus fuentes de datos para realizar reportes interactivos.': 'Connect and manage your data sources to create interactive reports.',
  'Nueva Conexión': 'New Connection',
  'Conexión guardada con advertencia de conectividad:': 'Connection saved with connectivity warning:',
  'Nombre descriptivo': 'Descriptive name',
  'Arrastra tu archivo aquí o haz clic para buscar': 'Drag your file here or click to browse',
  'Dataset (Base de Datos)': 'Dataset (Database)',
  'Warehouse (Almacén)': 'Warehouse',
  'Esquema (Schema)': 'Schema',
  'Nombre de la Base de Datos': 'Database Name',
  'Requerir conexión segura (TLS/SSL)': 'Require secure connection (TLS/SSL)',
  'Guardar Conexión': 'Save Connection',
  'No hay conectores registrados': 'No connectors registered',
  'Conecta PostgreSQL, MySQL, SQL Server o SQLite para empezar a crear consultas SQL.': 'Connect PostgreSQL, MySQL, SQL Server, or SQLite to start creating SQL queries.',
  'Agregar primer conector': 'Add first connector',
  'Políticas activas': 'Active policies',

  'Consultas': 'Queries',
  'Sin DBs conectadas': 'No DBs connected',
  'Ejecutando...': 'Running...',
  'Cancelando...': 'Canceling...',
  'Columna': 'Column',
  'tabla': 'table',
  'Tabla copiada al portapapeles': 'Table copied to clipboard: {table}',
  '¿Estás seguro de eliminar la consulta?': 'Are you sure you want to delete query "{name}"?',
  'Insertar': 'Insert',
  'Atajo: Ctrl+Enter': 'Shortcut: Ctrl+Enter',
  'filas': 'rows',
  'Filtro de filas:': 'Row filter:',
  'Columnas visibles:': 'Visible columns:',
  'de las disponibles': 'of the available columns',
  'Usa "Guardar consulta" para registrar una.': 'Use "Save query" to save one.',
  'ej. Reporte semanal de crecimiento...': 'e.g. Weekly growth report...',
  'Continuar': 'Continue',
  'Escribe consultas SQL libres y visualiza resultados instantáneamente.': 'Write free-form SQL queries and view results instantly.',
  'Cargando DBs...': 'Loading DBs...',
  'Programar Reporte': 'Schedule Report',
  'Ejecutar SQL (Ctrl+↵)': 'Run SQL (Ctrl+↵)',
  'No hay consultas guardadas.': 'No saved queries.',
  'Usa "Guardar Query" para registrar una.': 'Use "Save Query" to save one.',
  'No hay tablas disponibles.': 'No tables available.',
  'Selecciona una base de datos activa.': 'Select an active database.',
  'Resultado de la consulta': 'Query result',
  'Procesando consulta...': 'Processing query...',
  'Error del compilador de Base de Datos': 'Database compiler error',
  'Estás viendo datos filtrados según tu rol en esta organización.': 'You are viewing data filtered according to your role in this organization.',
  'Escribe código SQL y haz clic en "Ejecutar SQL" para ver resultados.': 'Write SQL code and click "Run SQL" to see results.',
  'Registra tu query para poder vincularla a gráficos y tableros interactivos.': 'Save your query so you can link it to charts and interactive dashboards.',
  '¡Consulta guardada con éxito!': 'Query saved successfully!',
  'Fallo al guardar la consulta.': 'Failed to save the query.',
  'Selecciona el dashboard de destino donde quieres agregar el gráfico de esta consulta.': 'Select the destination dashboard where you want to add this query chart.',
  'No tienes dashboards creados en esta organización.': 'You do not have dashboards created in this organization.',
  'Ir a Crear Dashboard': 'Go to Create Dashboard',
  'Dashboard Destino': 'Destination Dashboard',
  'Miembro agregado exitosamente.': 'Member added successfully.',
  'Contraseña temporal — se muestra una sola vez:': 'Temporary password — shown only once:',
  'Invitar a MetricFlow': 'Invite to MetricFlow',
  'Miembros Activos': 'Active Members',
  'Rol': 'Role',
  'Miembro desde': 'Member since',
  'No hay miembros en la organización': 'There are no members in the organization',
  'Usa el formulario de invitación para agregar personas.': 'Use the invitation form to add people.',
  'Volver al Dashboard': 'Back to Dashboard',
  'Diseña y previsualiza un gráfico interactivo a partir de tus consultas SQL guardadas.': 'Design and preview an interactive chart from your saved SQL queries.',
  'Ajustes del Widget': 'Widget Settings',
  'Título del Widget': 'Widget Title',
  'Consulta SQL Guardada': 'Saved SQL Query',
  'Tipo de Visualización': 'Visualization Type',
  'Configuración de Contenido': 'Content Settings',
  'El separador usa el título solo para identificar el widget en el dashboard.': 'The divider uses the title only to identify the widget in the dashboard.',
  'Configuración de Columnas': 'Column Settings',
  'Concatenar información en eje X': 'Concatenate information on X axis',
  'Color del Gráfico': 'Chart Color',
  'Previsualización en tiempo real': 'Real-time Preview',
  'Cargando datos de la consulta...': 'Loading query data...',
  'Error al ejecutar la consulta': 'Error running the query',
  'Sin datos de consulta': 'No query data',
  'Selecciona una consulta SQL guardada para cargar los datos y mapear los campos del gráfico.': 'Select a saved SQL query to load data and map chart fields.',
  'Guardar propiedades': 'Save properties',
  'Título del widget': 'Widget title',
  'Escribe el insight, contexto o recomendación...': 'Write the insight, context, or recommendation...',
  'Usuarios de solo lectura. Aplica la restricción más estricta.': 'Read-only users. Applies the strictest restriction.',
  'Error al guardar las políticas.': 'Error saving policies.',
  'Ver historial de envíos': 'View delivery history',
  'Eliminar': 'Delete',
  'No hay columnas suficientes para generar el gráfico circular': 'There are not enough columns to generate the pie chart',
  'Error al eliminar el widget.': 'Error deleting the widget.',
  'Escribe aquí el insight que acompaña este dashboard.': 'Write the insight that accompanies this dashboard here.',
  'Error al guardar el diseño.': 'Error saving the layout.',
  'Error al cambiar estado de compartido.': 'Error changing sharing status.',
  'Error al cambiar el estado de publicación.': 'Error changing publishing status.',
  'Error al ejecutar SQL.': 'Error running SQL.',
  'ej. Monitoreo de ingresos recurrentes mensuales y conversión...': 'e.g. Monthly recurring revenue and conversion monitoring...',
  'Error al ejecutar la consulta.': 'Error running the query.',
  '¡Conexión establecida correctamente!': 'Connection established successfully!',
  'Error al conectar con la base de datos.': 'Error connecting to the database.',
  'Ocurrió un error al guardar el conector.': 'An error occurred while saving the connector.',
  'Cerrar políticas': 'Close policies',
  'ej. Base de Datos de Ventas - Prod': 'e.g. Sales Database - Prod',
  'Eliminar conector': 'Delete connector',
  'Español': 'Spanish',
  'Documentación open source': 'Open source documentation',
  'Documentación de MetricFlow': 'MetricFlow documentation',
  'La documentación del repositorio vive en /docs': 'The repository documentation lives in /docs',
  'Sigue guías paso a paso para setup, fuentes de datos, consultas SQL, widgets, dashboards, compartir contenido y roles.': 'Follow step-by-step guides for setup, data sources, SQL queries, widgets, dashboards, sharing content, and roles.',
  'Publicación con GitHub Pages': 'Publishing with GitHub Pages',
  'Publica la documentación desde la rama principal y la carpeta /docs en Settings → Pages del repositorio.': 'Publish the documentation from the main branch and the /docs folder in the repository Settings → Pages.',
  'Ruta rápida': 'Quick path',
  'Abre /setup una vez para crear el owner de la organización; luego usa /login.': 'Open /setup once to create the organization owner; then use /login.',
  'Seguridad del contenido público': 'Public content security',
  'Usa usuarios de base de datos con privilegios mínimos en ejemplos y tutoriales.': 'Use least-privilege database users in examples and tutorials.',
  'Mantén alineadas las páginas en español e inglés cuando cambie el comportamiento.': 'Keep Spanish and English pages aligned when behavior changes.',
  'Secciones de documentación': 'Documentation sections',
  'Publicación': 'Publishing',
  '-- Escribe tu consulta SQL aquí\nSELECT 1 as test;': '-- Write your SQL query here\nSELECT 1 as test;',
  'Error al ejecutar la consulta SQL. Revisa tu sintaxis.': 'Error running the SQL query. Check your syntax.',
  'No fue posible cancelar la consulta.': 'Could not cancel the query.',
  'Guardar Consulta': 'Save Query',
  'Error al cargar el esquema de la base de datos:': 'Error loading the database schema:',
  'Eliminar consulta': 'Delete query',
  '>Escribe código SQL y haz clic en ': '>Write SQL code and click ',
  'Restablecer contraseña': 'Reset password',
  'Error al ejecutar la consulta SQL.': 'Error running the SQL query.',
  'Selecciona una consulta...': 'Select a query...',
  'No requiere consulta': 'No query required',
  'Categoría': 'Category',
  'Eje X (Categoría)': 'X Axis (Category)',
  'Texto narrativo del dashboard': 'Dashboard narrative text',
  'ej. Distribución de Ventas': 'e.g. Sales Distribution',
  'Escribe una explicación, insight o recomendación...': 'Write an explanation, insight, or recommendation...',
  'Idioma': 'Language',
  'Políticas de acceso': 'Access policies',
  'Restricciones activas para este rol': 'Active restrictions for this role',
  'Sin restricciones (acceso total)': 'No restrictions (full access)',
};

const TRANSLATIONS: Record<Locale, TranslationMap> = {
  es: {},
  en: EN_TRANSLATIONS,
};

const ATTRIBUTES_TO_TRANSLATE = ['placeholder', 'title', 'aria-label'] as const;
const originalTextNodes = new WeakMap<Text, string>();

function normalizeLocale(value?: string | null): Locale | null {
  if (!value) return null;
  const base = value.toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.includes(base as Locale) ? (base as Locale) : null;
}

export function detectLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const savedLocale = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    if (savedLocale) return savedLocale;
  }

  if (typeof navigator !== 'undefined') {
    for (const language of navigator.languages?.length ? navigator.languages : [navigator.language]) {
      const locale = normalizeLocale(language);
      if (locale) return locale;
    }
  }
  return 'en';
}

export function translate(value: string, locale: Locale): string {
  if (locale === 'es') return value;
  return TRANSLATIONS[locale][value] ?? value;
}

function translateTextNode(node: Text, locale: Locale) {
  const parent = node.parentElement;
  if (!parent) return;

  const currentText = node.textContent ?? '';
  const original = originalTextNodes.get(node) ?? currentText;
  const trimmed = original.trim();
  if (!trimmed) return;

  const translated = translate(trimmed, locale);
  const nextText = original.replace(trimmed, translated);
  originalTextNodes.set(node, original);

  if (currentText !== nextText) {
    node.textContent = nextText;
  }
}

function translateElementAttributes(element: Element, locale: Locale) {
  for (const attribute of ATTRIBUTES_TO_TRANSLATE) {
    const storedKey = `i18nOriginal${attribute.replace('-', '')}`;
    const original = (element as HTMLElement).dataset[storedKey] ?? element.getAttribute(attribute);
    if (!original) continue;
    (element as HTMLElement).dataset[storedKey] = original;
    element.setAttribute(attribute, translate(original, locale));
  }
}

function translateDom(root: ParentNode, locale: Locale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let current = walker.nextNode();
  while (current) {
    translateTextNode(current as Text, locale);
    current = walker.nextNode();
  }

  if (root instanceof Element) translateElementAttributes(root, locale);
  root.querySelectorAll?.('*').forEach((element) => translateElementAttributes(element, locale));
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (value: string) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  const setLocale = (nextLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    setLocaleState(nextLocale);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    translateDom(document.body, locale);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node as Text, locale);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateDom(node as Element, locale);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (text) => translate(text, locale),
    formatDate: (date, options) => new Intl.DateTimeFormat(locale, options).format(new Date(date)),
    formatDateTime: (date, options) => new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      ...options,
    }).format(new Date(date)),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}


export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border-2 border-[#23251d] bg-[#eeefe9] px-3 py-2 text-xs font-extrabold text-[#23251d] shadow-[2px_2px_0_0_#23251d]">
      <span aria-hidden="true">🌐</span>
      <span>Idioma</span>
      <select
        aria-label="Idioma"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="bg-transparent text-xs font-extrabold outline-none"
      >
        <option value="es">ES</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
