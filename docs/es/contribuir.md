# Contribuir a MetricFlow

Las contribuciones de la comunidad son bienvenidas. Esta guía explica cómo hacer cambios enfocados, fáciles de revisar y seguros para una plataforma analítica self-hosted.

## Buenas primeras contribuciones

| Área | Ejemplos |
|---|---|
| Documentación | Mejorar tutoriales, agregar capturas, aclarar errores de setup, traducir páginas. |
| Frontend | Pulido visual, estados vacíos, accesibilidad, usabilidad de dashboards. |
| Backend | Pruebas, casos borde de datasources, validación, mejoras de audit log. |
| Conectores | Documentación de drivers, ejemplos de conexión, defaults más seguros. |

## Antes de empezar

1. Busca issues y pull requests existentes.
2. Abre un issue para cambios grandes y confirma alcance con mantenedores.
3. Mantén el cambio enfocado en un comportamiento.
4. Evita refactors no relacionados.

## Flujo de desarrollo

```bash
git checkout -b feat/descripcion-corta
# realiza el cambio
git status --short
```

Usa mensajes de commit convencionales cuando sea posible:

```bash
git commit -m "docs: add dashboard sharing tutorial"
```

## Checklist de validación

Ejecuta los checks que correspondan al cambio:

| Tipo de cambio | Checks |
|---|---|
| Solo documentación | Revisa enlaces, encabezados y consistencia bilingüe. |
| Comportamiento backend | `cd backend && npm run lint && npm run build && npm test` |
| API/auth/persistencia/integración | Checks backend más `npm run test:e2e` |
| Comportamiento frontend | `cd frontend && npm run lint && npm run build` |

## Expectativas de seguridad

- No subas `.env`, credenciales, tokens, dumps de base de datos ni resultados de consultas.
- Trata credenciales de datasource, secretos JWT, llaves de cifrado, tokens de share y resultados de queries como información sensible.
- Preserva límites de organización en requests, persistencia, cachés y estado del cliente.
- Usa credenciales de prueba con privilegios mínimos en ejemplos.

## Checklist de pull request

- [ ] El cambio está limitado a un problema.
- [ ] La documentación se actualizó si cambió comportamiento visible para usuarios.
- [ ] Tests y builds relevantes pasan, o el PR explica por qué un check no pudo ejecutarse.
- [ ] Cambios de UI incluyen capturas o grabaciones cortas.
- [ ] Comportamientos sensibles de seguridad están señalados explícitamente.

## Reportar bugs

Abre un issue con:

- Versión de MetricFlow o commit SHA.
- Sistema operativo y versión de Node.js.
- Pasos para reproducir.
- Comportamiento esperado.
- Comportamiento actual.
- Logs o capturas con secretos removidos.
