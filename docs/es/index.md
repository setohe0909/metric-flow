# Documentación de MetricFlow

MetricFlow es una plataforma open source y self-hosted para analítica SQL y dashboards. Usa esta documentación para instalar el proyecto, crear el primer espacio de trabajo, conectar datos, construir dashboards y contribuir de forma segura.

## Ruta rápida

1. [Instala MetricFlow](./primeros-pasos.md) con Docker, Node.js, la API NestJS y el frontend React.
2. [Completa la configuración inicial](./tutoriales.md#tutorial-1-crear-el-primer-espacio-de-trabajo) para crear la organización y la cuenta propietaria.
3. [Conecta una fuente de datos](./tutoriales.md#tutorial-2-conectar-una-fuente-de-datos) y prueba la conexión.
4. [Ejecuta y guarda una consulta](./tutoriales.md#tutorial-3-ejecutar-y-guardar-una-consulta).
5. [Construye y comparte un dashboard](./tutoriales.md#tutorial-4-construir-y-compartir-un-dashboard).

## Mapa de documentación

| Página | Úsala cuando quieras |
|---|---|
| [Primeros pasos](./primeros-pasos.md) | Ejecutar el proyecto localmente desde un clon limpio. |
| [Tutoriales](./tutoriales.md) | Aprender el producto con guías paso a paso. |
| [Contribuir](./contribuir.md) | Preparar una contribución o reporte de bug. |
| [Publicación](./publicacion.md) | Publicar `/docs` como sitio público de GitHub Pages. |
| [English](../en/) | Leer la misma documentación en inglés. |

## Qué incluye MetricFlow hoy

- Un espacio de trabajo self-hosted por instalación.
- Autenticación JWT con acceso basado en roles.
- Credenciales de fuentes de datos cifradas.
- Editor SQL, consultas guardadas, widgets, dashboards y dashboards públicos.
- PostgreSQL como almacenamiento de metadatos y drivers para bases analíticas comunes.

## Principios de documentación

- Primero el camino feliz; luego detalles y casos especiales.
- Preferir listas, tablas, ejemplos y capturas sobre prosa extensa.
- Marcar claramente los pasos sensibles de seguridad.
- Mantener alineadas las páginas en español e inglés cuando cambie el comportamiento visible para usuarios.
