# Frontend Auth Integration

## Purpose
Reference for Angular auth integration with backend contract.

## Environment
`client/src/environments/environment.ts`
- `apiBaseUrl: 'http://localhost:8080/api'`

## Model Shape
`LoginResponse` fields used by frontend:
- `accessToken`
- `refreshToken`
- `userId`
- `email`
- `roles`

## Auth Service Responsibilities
- call `/auth/login`
- map response to local `User`
- store `accessToken` + `user` in `sessionStorage`
- store `refreshToken` in `localStorage`

## Guards
- `AuthGuard`: requires authenticated state
- `RoleGuard`: checks `user.roles`

## Role Priority Redirect
Recommended role priority:
1. `ADMIN`
2. `TEACHER`
3. `STUDENT`
4. `GUARDIAN`

## Troubleshooting
If login succeeds but no navigation:
- check `sessionStorage.accessToken`
- check `sessionStorage.user`
- ensure redirect uses `roles`, not `role`

## Last Updated
- 2026-05-11

