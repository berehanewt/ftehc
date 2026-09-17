import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-role-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="role-landing">
      <p>Redirecting to your dashboard...</p>
    </div>
  `,
  styles: [`
    .role-landing {
      padding: 2rem;
      color: #666;
      font-size: 0.95rem;
    }
  `]
})
export class RoleLandingComponent implements OnInit {
  private readonly rolePriority = ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'] as const;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user || !user.roles || user.roles.length === 0) {
      this.router.navigate(['/login']);
      return;
    }

    const targetRole = this.rolePriority.find(role => user.roles.includes(role)) ?? user.roles[0];
    this.router.navigateByUrl(`/${targetRole.toLowerCase()}`);
  }
}

