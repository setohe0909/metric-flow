# Tutorials

These walkthroughs teach the core MetricFlow workflow: set up a workspace, connect data, run SQL, create charts, and share dashboards.

## Tutorial 1: Create the first workspace

Use this on a new installation.

1. Start the backend and frontend from [Getting started](./getting-started.md).
2. Open `http://localhost:5173/setup`.
3. Enter the organization name and owner account details.
4. Submit the form.
5. Sign in with the owner account.

Expected result: the installation is initialized and future visits should use `/login`.

## Tutorial 2: Connect a datasource

1. Sign in as an administrator or editor.
2. Open **Datasources**.
3. Choose the datasource type.
4. Enter the connection details.
5. Click **Test connection** before saving.
6. Save the datasource only after the test succeeds.

Security notes:

- Store least-privilege database credentials.
- Prefer read-only database users for analytical connections.
- Do not paste production credentials into screenshots or bug reports.

## Tutorial 3: Run and save a query

1. Open the SQL editor.
2. Select a datasource.
3. Write a read-only SQL query.
4. Run the query and inspect the result columns and rows.
5. Save the query with a clear name and description.

Example naming pattern:

| Query name | Good when |
|---|---|
| `weekly_revenue_by_region` | The query produces a reusable business metric. |
| `active_users_last_30_days` | The query is scoped to a common reporting window. |

## Tutorial 4: Build and share a dashboard

1. Create or open a dashboard.
2. Add a widget from a saved query.
3. Pick a chart type such as bar, line, pie, KPI, or table.
4. Arrange widgets into a readable layout.
5. Save the dashboard.
6. If public sharing is appropriate, enable sharing and copy the share link or embed snippet.

Sharing checklist:

- Confirm the dashboard does not expose sensitive rows, columns, or internal identifiers.
- Review row and column policies on the datasource.
- Disable public sharing when the link is no longer needed.

## Tutorial 5: Invite users and assign roles

1. Sign in as an administrator.
2. Open user or organization settings.
3. Create or invite the user.
4. Assign the smallest role that fits their job.

| Role | Typical use |
|---|---|
| Admin | Manages users, datasources, settings, and content. |
| Editor | Creates datasources, queries, widgets, and dashboards. |
| Reader | Views published analytical content. |

## Tutorial 6: Validate a community change

Before opening a pull request:

```bash
cd backend
npm run lint
npm run build
npm test

cd ../frontend
npm run lint
npm run build
```

If you changed API behavior, authentication, persistence, or module integration, also run backend end-to-end tests:

```bash
cd backend
npm run test:e2e
```

## Next step

Read the [contributing guide](./contributing.md) before opening an issue or pull request.
