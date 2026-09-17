# Dashboards and Landing Pages Copilot Guide

## Purpose
This guide defines a clean, role-based dashboard and landing page implementation for the School Portal frontend.

## Scope
The guide covers:
- unauthenticated landing flow (`/login`, password recovery)
- authenticated shell flow (`AppShellComponent`)
- role dashboard landing routes (`/admin`, `/teacher`, `/student`, `/guardian`)
- consistent redirect behavior after login and refresh

## Route and Access Rules
- Public routes:
  - `/login`
  - `/forgot-password`
  - `/reset-password/:token`
- Protected app shell route:
  - `path: ''` with `AuthGuard`
- Role dashboard entry routes (children of shell):
  - `/admin` (role `ADMIN`)
  - `/teacher` (role `TEACHER`)
  - `/student` (role `STUDENT`)
  - `/guardian` (role `GUARDIAN`)
- Route guards:
  - authentication: `AuthGuard`
  - authorization: `RoleGuard`

## Landing Behavior Requirements
1. If user is not authenticated, navigate to `/login`.
2. After successful login, navigate in this order:
   - `redirectUrl` (if set and not `/` or `/login`)
   - otherwise the highest-priority role dashboard.
3. Role priority order:
   - `ADMIN`, `TEACHER`, `STUDENT`, `GUARDIAN`
4. If no valid role exists, show a clear error and do not navigate silently.
5. Root app template must render route outlet cleanly (no starter placeholder UI).

## Frontend Files
- `client/src/app/app.routes.ts`
- `client/src/app/app.html`
- `client/src/app/features/auth/login/login.component.ts`
- `client/src/app/core/guards/auth.guard.ts`
- `client/src/app/core/guards/role.guard.ts`
- `client/src/app/core/services/auth.service.ts`
- `client/src/app/core/layout/app-shell.component.ts`

## Backend SPA Forwarding
When serving Angular from Spring Boot static resources, forward these routes to `index.html`:
- `/`
- `/login`
- `/forgot-password`
- `/reset-password/**`
- `/admin` and `/admin/**`
- `/teacher` and `/teacher/**`
- `/student` and `/student/**`
- `/guardian` and `/guardian/**`
- `/unauthorized`
- `/not-found`

Reference file:
- `src/main/java/com/ftehc/ftehc/FtehcApplication.java`

## Dashboard Content Baseline
Each dashboard landing page should include:
- page title and short welcome text
- quick links to top 3-6 module actions
- role-relevant summary cards
- empty-state messages when no data is available

### Admin Landing
- users management
- classes management
- enrollment management
- guardian links
- audit logs

### Teacher Landing
- my classes
- homework create/list
- submissions review
- announcements

### Student Landing
- homework list
- homework detail/submit
- announcements
- documents

### Guardian Landing
- child progress
- announcements
- documents

## API and Auth Expectations
- Login API response should include:
  - `accessToken`
  - `refreshToken`
  - `userId`
  - `email`
  - `roles`
- Frontend must normalize role strings if backend returns prefixed forms (example: `ROLE_ADMIN` to `ADMIN`).

## Copilot Implementation Checklist
- [ ] guards block unauthorized routes and redirect correctly
- [ ] login redirects to expected dashboard
- [ ] `/admin`, `/teacher`, `/student`, `/guardian` open directly on refresh
- [ ] route fallback goes to `/not-found`
- [ ] unauthorized role access goes to `/unauthorized`
- [ ] app shell menu reflects primary role
- [ ] dashboard pages are responsive on mobile and desktop

## Verification Steps
1. Log in as each role and confirm redirect to correct dashboard.
2. Refresh browser on each dashboard route and verify page still loads.
3. Attempt accessing another role's route and confirm unauthorized handling.
4. Confirm backend serves SPA routes (no 404 on role base paths).
5. Validate `http://localhost:8080/actuator/health` remains `UP`.

## Last Updated
- 2026-05-12
