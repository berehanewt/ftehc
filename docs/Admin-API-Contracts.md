# Admin API Contracts

## Base
- API base: `/api`
- Admin base: `/api/admin`
- Auth: `Authorization: Bearer <accessToken>`
- Required role: `ADMIN`

## Users
### GET `/api/admin/users`
List users with optional paging/filter.

### POST `/api/admin/users`
Create user.
Request fields:
- `email`
- `password`
- `firstName`
- `lastName`
- `roles`
- `active`

### PUT `/api/admin/users/{id}`
Update user profile/roles/active.

### PATCH `/api/admin/users/{id}/active`
Enable/disable user.

## Classes
### GET `/api/admin/classes`
List classes.

### POST `/api/admin/classes`
Create class (`name`, `section`, `teacherId`).

### PUT `/api/admin/classes/{id}`
Update class.

### DELETE `/api/admin/classes/{id}`
Delete/archive class.

## Enrollment
### GET `/api/admin/enrollment`
List enrollments.

### POST `/api/admin/enrollment`
Create enrollment (`classId`, `studentId`).

### DELETE `/api/admin/enrollment/{id}`
Remove enrollment.

## Guardian Links
### GET `/api/admin/guardian-links`
List links.

### POST `/api/admin/guardian-links`
Create link (`guardianId`, `studentId`, `relationship`).

### DELETE `/api/admin/guardian-links/{id}`
Remove link.

## Audit Logs
### GET `/api/admin/audit-logs`
List audit entries.

## Status Codes
- `200` success
- `201` created
- `400` validation error
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict
- `500` server error

## Last Updated
- 2026-05-11

