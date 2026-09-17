import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private readonly rolePriority = ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'] as const;

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredRoles = route.data['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = this.authService.getUser();
    if (!user || !user.roles || user.roles.length === 0) {
      this.router.navigate(['/login']);
      return false;
    }

    // Pick highest-priority role from the user's roles.
    const effectiveRole =
      this.rolePriority.find(role => user.roles.includes(role)) ?? user.roles[0];

    if (requiredRoles.includes(effectiveRole)) {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
