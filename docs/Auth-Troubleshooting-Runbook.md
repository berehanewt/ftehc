# Auth Troubleshooting Runbook

## Quick Triage
1. Check backend health (`/actuator/health`).
2. Test login API directly (`/api/auth/login`).
3. Check browser Network/Console for CORS or payload issues.
4. Verify token/user are stored in browser storage.
5. Verify guard and role route config.

## Common Issues
### `ERR_CONNECTION_REFUSED`
- backend not running or wrong port.

### CORS blocked
- backend CORS not allowing frontend origin.

### `400 Bad Request` on login
- payload shape mismatch or bad credentials.
- expected keys: `email`, `password`.

### Login succeeds but no redirect
- frontend maps wrong response shape.
- still using `user.role` instead of `user.roles`.

## Useful Checks
PowerShell login test:
```powershell
$body = @{ email = "admin@school.com"; password = "Admin123!" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $body
```

## Last Updated
- 2026-05-11

