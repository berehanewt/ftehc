# School Portal Next Steps Guide

## Current Baseline
- Backend and frontend are running in local dev.
- MongoDB is connected.
- Auth login flow is operational.
- Role-based route protection is in place.

## Next Implementation Stages
1. Complete admin management features (users, classes, enrollment, guardian links, audit logs).
2. Complete teacher workflows (classes, homework, submissions, announcements).
3. Complete student workflows (homework, announcements, documents, profile).
4. Complete guardian workflows (progress, announcements, documents).
5. Add test coverage for critical auth and role flows.
6. Harden production security and deployment process.

## Production Readiness
- Move secrets to environment variables.
- Restrict CORS to production frontend domains.
- Validate rollback steps and recovery ownership.
- Execute go-live smoke tests.

## Core References
- `docs/Admin-Dashboard-Copilot-Guide.md`
- `docs/Auth-API-Contracts.md`
- `docs/Admin-API-Contracts.md`
- `docs/Frontend-Auth-Integration.md`
- `docs/Deployment-Checklist.md`

## Last Updated
- 2026-05-11
