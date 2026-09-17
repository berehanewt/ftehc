# School Portal - Angular Frontend

A responsive, role-based Angular single-page application (SPA) for a middle school portal system.

## Features

✅ **Authentication**
- JWT-based login with access and refresh tokens
- Secure token storage and auto-refresh on 401
- Role-based access control (RBAC)

✅ **Role-Based Dashboards**
- **Admin**: User/class/enrollment management, audit logs
- **Teacher**: Homework creation, student submissions management
- **Student**: Homework viewing and submission, announcements, documents
- **Guardian**: Child progress monitoring, announcements, documents

✅ **User Experience**
- Mobile-first responsive design
- Role-scoped navigation menu
- Toast notifications for success/error messages
- Loading indicators
- Protected routes with guards

## Quick Start

```bash
npm install
npm start
```

Navigate to `http://localhost:4200`. The app will auto-reload on code changes.

`npm start` runs Angular dev server with API proxy enabled (`proxy.conf.json`).
You can also run the full app from Spring Boot on `http://localhost:8080/login` using the repo-root startup scripts.

### Run Frontend + Backend Locally

```bash
# terminal 1 (backend from repo root)
cd ..
pwsh -ExecutionPolicy Bypass -File ./run-local.ps1

# terminal 2 (frontend)
cd client
npm start
```

### One-Port Local Login via Spring Boot

```bash
# from repo root
pwsh -ExecutionPolicy Bypass -File ./dev-restart.ps1
```

Then open `http://localhost:8080/login`.

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/app/
├── core/                 # Services, guards, interceptors, auth models
├── shared/               # Reusable components, services, DTOs
└── features/             # Lazy-loaded role-based modules
    ├── auth/
    ├── admin/
    ├── teacher/
    ├── student/
    └── guardian/
```

## Configuration

Development API base URL in `src/environments/environment.ts` is intentionally direct so login/API calls still work even if the Angular dev proxy is not the active path:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api'
};
```

The optional Angular dev proxy target remains configured in `proxy.conf.json`.

For production builds, `src/environments/environment.prod.ts` also uses `'/api'`
so API calls remain same-origin behind Spring Boot.

## Troubleshooting Login on `localhost:4200`

- If login appears to submit but does not continue, confirm backend is running on `http://localhost:8080`.
- Restart dev server after config changes: stop `npm start`, then run it again.
- If you prefer not to use the Angular dev server, start the repo from the root and use `http://localhost:8080/login` instead.
- Verify proxy path works:

```bash
curl -i http://localhost:4200/api/auth/login
```

- If this returns `Cannot POST /api/auth/login`, dev server proxy is not active.

## Authentication Flow

1. User logs in → Receives `accessToken` + `refreshToken`
2. `TokenInterceptor` attaches JWT to all API requests
3. On 401, automatically refreshes token
4. On failure, redirects to login

## Services

- **AuthService**: JWT login/refresh/logout
- **NotificationService**: Toast notifications
- **LoadingService**: Global/scoped loading states

## Testing

```bash
npm test          # Run unit tests
npm run test:admin-filters  # Run targeted Admin enrollment/guardian filter tests
npm run test:teacher-homework  # Run targeted Teacher homework tests
npm run test:teacher-submissions  # Run targeted Teacher submissions tests
npm run test:teacher-core  # Run teacher homework + submissions tests together
npm run test:student-submissions  # Run targeted Student submissions tests
npm run test:guardian-homework  # Run targeted Guardian homework monitor tests
npm run test:filters-pack  # Run Guardian+Teacher filter behavior tests only
npm run test:role-pack  # Run Teacher + Student + Guardian role-module tests together
npm run test:deeplink-monitor-pack  # Run Teacher deep-link + Student/Guardian monitor pack tests
npm run test:portal-critical  # Run Admin + Teacher + Student + Guardian critical targeted tests together
```

## Documentation

See `Copilot-Frontend-Spec-Middle-School-Portal.odt` for full feature specifications.
