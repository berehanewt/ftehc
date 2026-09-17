# Deployment Checklist

## Pre-Deploy
- [ ] Backend build passes
- [ ] Frontend build passes
- [ ] Required env vars set
- [ ] DB backup completed
- [ ] Release notes prepared

## Backend
- [ ] Deploy artifact
- [ ] Startup successful
- [ ] `/actuator/health` is `UP`

## Frontend
- [ ] Deploy static build
- [ ] API base URL points to target backend
- [ ] No critical console errors

## Auth and Access
- [ ] Login works
- [ ] Admin can access `/admin`
- [ ] Non-admin cannot access admin routes

## Rollback Readiness
- [ ] Previous backend artifact available
- [ ] Previous frontend artifact available
- [ ] DB restore point recorded

## Last Updated
- 2026-05-11

