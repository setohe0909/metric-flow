# Publish the Documentation with GitHub Pages

This project keeps community documentation in `/docs` so maintainers can publish it directly with GitHub Pages.

## Recommended setup

1. Push these docs to the repository default branch.
2. Open the repository on GitHub.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the default branch and the `/docs` folder.
6. Save the configuration.
7. Wait for the Pages deployment to finish and share the generated URL.

## Public content checklist

Before publishing, confirm that `/docs` contains only community-safe content:

- [ ] No secrets, tokens, credentials, or `.env` values.
- [ ] No private customer names, datasets, screenshots, or query results.
- [ ] English and Spanish pages are aligned.
- [ ] Links are relative when pointing to files inside `/docs`.
- [ ] Setup instructions match the current repository commands.

## Maintenance workflow

When product behavior changes:

1. Update the English page.
2. Update the matching Spanish page.
3. Check local links.
4. Include docs changes in the same pull request as the user-facing change.

## Useful references

- GitHub Docs: [GitHub Pages](https://docs.github.com/en/pages)
- GitHub Docs: [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
