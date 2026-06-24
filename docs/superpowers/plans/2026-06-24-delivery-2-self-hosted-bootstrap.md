# Delivery 2 Self-Hosted Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace public registration and multi-organization creation with a one-time self-hosted setup flow that creates the installation organization and first owner atomically.

**Architecture:** Persist installation completion in a singleton metadata record. A dedicated setup service owns public setup status and bootstrap; authentication only handles login after initialization. Existing organization-scoped internals remain temporarily intact for compatibility, but no API or UI can create additional organizations.

**Tech Stack:** NestJS 11, Prisma 6, PostgreSQL, React 19, TanStack Query, Zustand, Jest.

---

### Task 1: Persist installation state

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/*_add_installation_state/migration.sql`

- [ ] Add singleton `Installation` model with fixed identifier `1`, initialization timestamp, optional organization and administrator references.
- [ ] Add inverse optional relations to `User` and `Organization`.
- [ ] Create a migration that marks databases with existing users or organizations as initialized without deleting data.
- [ ] Generate Prisma Client and inspect migration SQL for destructive operations.

### Task 2: One-time atomic bootstrap API

**Files:**
- Create: `backend/src/setup/dto/bootstrap.dto.ts`
- Create: `backend/src/setup/setup.service.ts`
- Create: `backend/src/setup/setup.service.spec.ts`
- Create: `backend/src/setup/setup.controller.ts`
- Create: `backend/src/setup/setup.module.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `backend/src/auth/auth.service.ts`
- Modify: `backend/src/auth/dto/auth.dto.ts`
- Modify: `backend/src/organizations/organizations.controller.ts`
- Modify: `backend/src/organizations/organizations.service.ts`

- [ ] Write failing tests for uninitialized status, successful bootstrap, already initialized rejection, and transaction conflict mapping.
- [ ] Implement `GET /api/setup/status`.
- [ ] Implement `POST /api/setup/bootstrap` using one Prisma transaction that creates user, organization, owner membership, and installation row.
- [ ] Normalize email and organization slug and return the same authenticated payload as login.
- [ ] Remove public `/auth/register`.
- [ ] Remove `POST /organizations` and the unused organization-creation service.
- [ ] Keep existing data readable and existing login behavior intact.

### Task 3: Setup assistant frontend

**Files:**
- Create: `frontend/src/features/setup/hooks/use-setup.ts`
- Create: `frontend/src/pages/setup.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/login.tsx`
- Modify: `frontend/src/features/auth/hooks/use-auth.ts`
- Delete: `frontend/src/pages/signup.tsx`

- [ ] Query setup status without authentication.
- [ ] Redirect `/setup` to `/login` when initialized.
- [ ] Redirect `/login` to `/setup` when uninitialized.
- [ ] Submit bootstrap data and initialize the authenticated store from the returned payload.
- [ ] Remove registration mutation, signup route, and signup links.
- [ ] Preserve accessible labels, loading state, errors, and keyboard submission.

### Task 4: Verification and review

- [ ] Run focused new tests and watch RED before implementation.
- [ ] Run backend unit tests, build, and E2E.
- [ ] Run frontend build with supported Node runtime.
- [ ] Review race conditions, public endpoint exposure, response secrets, existing-install migration, and organization-creation bypasses.
- [ ] Commit backend and frontend as separate work units.
