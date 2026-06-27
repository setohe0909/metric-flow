# Publicar la documentación con GitHub Pages

Este proyecto guarda la documentación de comunidad en `/docs` para que los mantenedores puedan publicarla directamente con GitHub Pages.

## Configuración recomendada

1. Sube estos documentos a la rama principal del repositorio.
2. Abre el repositorio en GitHub.
3. Ve a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama principal y la carpeta `/docs`.
6. Guarda la configuración.
7. Espera a que termine el despliegue de Pages y comparte la URL generada.

## Checklist de contenido público

Antes de publicar, confirma que `/docs` solo tenga contenido seguro para la comunidad:

- [ ] Sin secretos, tokens, credenciales ni valores de `.env`.
- [ ] Sin nombres privados de clientes, datasets, capturas o resultados de queries.
- [ ] Páginas en español e inglés alineadas.
- [ ] Enlaces relativos cuando apunten a archivos dentro de `/docs`.
- [ ] Instrucciones de setup alineadas con los comandos actuales del repositorio.

## Flujo de mantenimiento

Cuando cambie comportamiento de producto:

1. Actualiza la página en inglés.
2. Actualiza la página equivalente en español.
3. Revisa los enlaces locales.
4. Incluye los cambios de documentación en el mismo pull request del cambio visible para usuarios.

## Referencias útiles

- GitHub Docs: [GitHub Pages](https://docs.github.com/en/pages)
- GitHub Docs: [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
