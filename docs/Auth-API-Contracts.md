# Auth API Contracts

## Base
- API base: `/api`
- Auth base: `/api/auth`

## Login
### POST `/api/auth/login`
Request:
```json
{
  "email": "admin@school.com",
  "password": "Admin123!"
}
```
Response:
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<token>",
  "userId": "<id>",
  "email": "admin@school.com",
  "roles": ["ADMIN"]
}
```

## Refresh
### POST `/api/auth/refresh`
Request:
```json
{ "refreshToken": "<token>" }
```
Response shape matches login response.

## Logout
### POST `/api/auth/logout`
Request:
```json
{ "refreshToken": "<token>" }
```

## Common Errors
- `400` invalid request
- `401` invalid credentials/token
- `403` blocked user/role

## Frontend Mapping
Frontend should map response to user:
- `id <- userId`
- `email <- email`
- `roles <- roles`

## Last Updated
- 2026-05-11

