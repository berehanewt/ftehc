# Admin Dashboard Copilot Guide

## Purpose
This guide defines how to complete and maintain the Admin module for the School Portal.

## Scope
Admin can manage:
- users and roles
- classes
- enrollment
- guardian links
- audit logs

## Route and Access
- Main route: `/admin`
- Route guard: `AuthGuard` + `RoleGuard`
- Required role: `ADMIN`

## Backend API Areas
- `/api/admin/users`
- `/api/admin/classes`
- `/api/admin/enrollment`
- `/api/admin/guardian-links`
- `/api/admin/audit-logs`

## Frontend Areas
- `client/src/app/features/admin/admin-dashboard/`
- `client/src/app/features/admin/users/`
- `client/src/app/features/admin/classes/`
- `client/src/app/features/admin/enrollment/`
- `client/src/app/features/admin/guardian-links/`
- `client/src/app/features/admin/audit-logs/`

## Delivery Order
1. Users
2. Classes
3. Enrollment
4. Guardian links
5. Audit logs

## Quality Checklist
- role checks enforced on all admin APIs
- DTO validation added for create/update
- paginated list endpoints
- friendly frontend error handling
- tests for critical admin flows

## Last Updated
- 2026-05-11

