# Contributing to MetricFlow

Community contributions are welcome. This guide explains how to make changes that are focused, reviewable, and safe for a self-hosted analytics platform.

## Good first contributions

| Area | Examples |
|---|---|
| Documentation | Improve tutorials, add screenshots, clarify setup errors, translate pages. |
| Frontend | UI polish, empty states, accessibility improvements, dashboard usability. |
| Backend | Tests, datasource edge cases, validation, audit logging improvements. |
| Connectors | Driver documentation, connection examples, safer defaults. |

## Before you start

1. Search existing issues and pull requests.
2. Open an issue for larger changes so maintainers can confirm scope.
3. Keep the change focused on one behavior.
4. Avoid unrelated refactors.

## Development workflow

```bash
git checkout -b feat/short-description
# make the change
git status --short
```

Use conventional commit messages when possible:

```bash
git commit -m "docs: add dashboard sharing tutorial"
```

## Validation checklist

Run the checks that match your change:

| Change type | Checks |
|---|---|
| Docs only | Proofread links, headings, and bilingual consistency. |
| Backend behavior | `cd backend && npm run lint && npm run build && npm test` |
| API/auth/persistence integration | Backend checks plus `npm run test:e2e` |
| Frontend behavior | `cd frontend && npm run lint && npm run build` |

## Security expectations

- Do not commit `.env` files, credentials, tokens, database dumps, or query results.
- Treat datasource credentials, JWT secrets, encryption keys, share tokens, and query results as sensitive.
- Preserve organization boundaries in API requests, persistence, caches, and client state.
- Use least-privilege test credentials in examples.

## Pull request checklist

- [ ] The change is scoped to one problem.
- [ ] Documentation is updated when user-facing behavior changes.
- [ ] Relevant tests and builds pass, or the PR explains why a check could not be run.
- [ ] Screenshots or short recordings are included for UI changes.
- [ ] Security-sensitive behavior is called out explicitly.

## Reporting bugs

Open an issue with:

- MetricFlow version or commit SHA.
- Operating system and Node.js version.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Logs or screenshots with secrets removed.
