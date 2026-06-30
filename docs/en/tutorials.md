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

## Tutorial 7: Configure datasource policies

Use this when different roles should see different rows or columns.

1. Sign in as an administrator.
2. Open **Datasources** and select the datasource.
3. Open the access policy editor.
4. Configure `READER` and/or `EDITOR` policies.
5. Use `allowedColumns` to restrict visible columns.
6. Use `rowFilter` to restrict rows, for example `region = 'LATAM'`.
7. Save the policy and verify the result with a lower-privilege user.

Policy checklist:

- Start with the smallest useful restriction.
- Test with representative dashboards and saved queries.
- Do not use row filters as a replacement for database-level least privilege.

## Tutorial 8: Schedule a query report

1. Save a query with a clear name.
2. Open **Programar envío** / schedule delivery from the SQL editor.
3. Add one or more email recipients.
4. Pick a frequency or provide a custom cron expression.
5. Choose `csv`, `html`, or `json`.
6. Save the schedule.
7. Review schedule history after it runs.

If SMTP is not configured, MetricFlow logs the report payload to the backend console instead of sending email.

## Tutorial 9: Review audit and hardening signals

1. Sign in as an administrator or editor.
2. Use audit data to review dashboard publishing, public dashboard views, and schedule changes.
3. Investigate failed executions using execution status, error messages, and schedule history.
4. Revoke public dashboard sharing when a link should no longer be accessible.

Security review checklist:

- Public dashboard links are intentional and current.
- Datasource policies match role expectations.
- Scheduled recipients are still valid.
- Secrets are stored only in environment variables or encrypted datasource settings.

## Next step

Read the [feature catalog](./features.md), [configuration reference](./configuration.md), and [security hardening guide](./security-hardening.md) before opening an issue or pull request.
