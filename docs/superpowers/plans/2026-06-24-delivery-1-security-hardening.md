# Delivery 1 Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unsafe secret fallbacks, enforce fail-closed read-only SQL for every query execution path, and prevent viewers from administering datasources.

**Architecture:** Add small policy modules at existing security boundaries instead of restructuring the application. Environment validation remains framework-independent, SQL parsing is isolated behind a read-only policy, and datasource authorization uses reusable NestJS metadata and a guard.

**Tech Stack:** NestJS 11, TypeScript, Jest, node-sql-parser, Prisma.

---

### Task 1: Mandatory and distinct application secrets

**Files:**
- Create: `backend/src/common/config/security-config.ts`
- Create: `backend/src/common/config/security-config.spec.ts`
- Modify: `backend/src/main.ts`
- Modify: `backend/src/auth/auth.module.ts`
- Modify: `backend/src/auth/strategies/jwt.strategy.ts`
- Modify: `backend/src/common/encryption/encryption.service.ts`

- [ ] **Step 1: Write failing tests**

Test that configuration rejects missing `JWT_SECRET`, missing `ENCRYPTION_KEY`, and equal values, and returns both values when they are present and distinct.

- [ ] **Step 2: Verify RED**

Run:

```bash
cd backend
npm test -- --runInBand src/common/config/security-config.spec.ts
```

Expected: FAIL because `loadSecurityConfig` does not exist.

- [ ] **Step 3: Implement minimal configuration loader**

Create a pure `loadSecurityConfig(env)` function returning:

```ts
{
  jwtSecret: string;
  encryptionKey: string;
}
```

It throws descriptive startup errors when either secret is absent/blank or both values are equal.

- [ ] **Step 4: Remove all fallbacks**

Validate once before `NestFactory.create`, use the required JWT secret in `JwtModule` and `JwtStrategy`, and use only `ENCRYPTION_KEY` in `EncryptionService`.

- [ ] **Step 5: Verify GREEN**

Run the focused test, complete backend tests, and backend build.

### Task 2: Fail-closed read-only SQL policy

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Create: `backend/src/query-engine/sql-read-only-policy.ts`
- Create: `backend/src/query-engine/sql-read-only-policy.spec.ts`
- Modify: `backend/src/query-engine/query-engine.service.ts`

- [ ] **Step 1: Add parser dependency**

Install `node-sql-parser` as a runtime dependency.

- [ ] **Step 2: Write failing policy tests**

Cover PostgreSQL and MySQL:

```ts
SELECT * FROM users
WITH active AS (SELECT * FROM users) SELECT * FROM active
```

Reject:

```ts
UPDATE users SET active = true
DELETE FROM users
DROP TABLE users
SELECT * FROM users; DELETE FROM users
WITH changed AS (UPDATE users SET active = true RETURNING *) SELECT * FROM changed
SELECT * INTO copied_users FROM users
SELECT * FROM users FOR UPDATE
```

Also reject unsupported dialects and parser failures.

- [ ] **Step 3: Verify RED**

Run:

```bash
cd backend
npm test -- --runInBand src/query-engine/sql-read-only-policy.spec.ts
```

Expected: FAIL because the policy does not exist.

- [ ] **Step 4: Implement policy**

Parse using the datasource dialect, require exactly one top-level `select`, recursively reject write/destructive statement nodes, `INTO`, and locking reads, and fail closed on any parse error.

- [ ] **Step 5: Route execution through policy**

Call the policy at the start of `QueryEngineService.executeQuery`. Apply a top-level `LIMIT 1000` when the accepted statement has no limit. Because dashboards, schedules, test connections, and interactive queries already call this method, they inherit the same restriction.

- [ ] **Step 6: Verify GREEN**

Run focused policy tests, complete backend tests, and backend build.

### Task 3: Datasource role enforcement

**Files:**
- Create: `backend/src/auth/decorators/roles.decorator.ts`
- Create: `backend/src/auth/guards/roles.guard.ts`
- Create: `backend/src/auth/guards/roles.guard.spec.ts`
- Modify: `backend/src/datasource/datasource.controller.ts`
- Modify: `backend/src/datasource/datasource.module.ts`

- [ ] **Step 1: Write failing guard tests**

Test that routes without metadata remain accessible, matching roles pass, and a `viewer` is rejected from owner/admin routes.

- [ ] **Step 2: Verify RED**

Run:

```bash
cd backend
npm test -- --runInBand src/auth/guards/roles.guard.spec.ts
```

Expected: FAIL because the decorator and guard do not exist.

- [ ] **Step 3: Implement minimal declarative RBAC**

Create `@Roles(...roles)` metadata and a `RolesGuard` that reads `request.userRole`, denies by default when required metadata exists and the role does not match, and throws `ForbiddenException`.

- [ ] **Step 4: Protect datasource mutations**

Keep datasource listing available to all authenticated members. Restrict create, upload, test, schema inspection, and delete to current `owner/admin`; keep policy updates `owner` only. These temporary role names will be migrated in Delivery 3.

- [ ] **Step 5: Verify GREEN**

Run focused guard tests, complete backend tests, backend build, and E2E tests if the environment is available.

### Task 4: Risk-focused review and final verification

**Files:**
- Review every changed file.

- [ ] **Step 1: Review for blocking risks**

Check secret leakage, authorization bypasses, parser fail-open behavior, multi-statement handling, CTE writes, unsupported dialect behavior, and accidental changes to unrelated datasource reads.

- [ ] **Step 2: Run complete validation**

```bash
cd backend
npm run lint
npm run build
npm test -- --runInBand
npm run test:e2e
```

Run frontend build with a supported Node runtime to confirm the backend-only slice did not alter frontend compilation.

- [ ] **Step 3: Inspect diff**

Confirm no generated output, `.env`, credentials, coverage, or dependency directories are tracked.
