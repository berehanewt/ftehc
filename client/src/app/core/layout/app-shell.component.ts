import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PanelMenuModule } from 'primeng/panelmenu';
import { AuthService } from '../services/auth.service';
import { User } from '../models/auth.model';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, PanelMenuModule],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent implements OnInit {
  user: User | null = null;
  sidenavOpen = true;
  isMobile = false;
  menuModel: MenuItem[] = [];

  private readonly rolePriority = ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'] as const;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.authState$.subscribe(state => {
      this.user = state.user;
      this.buildMenuModel();
    });

    this.checkMobile();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.sidenavOpen = false;
    }
  }

  toggleSidenav(): void {
    this.sidenavOpen = !this.sidenavOpen;
  }

  closeSidenavOnMobile(): void {
    if (this.isMobile) {
      this.sidenavOpen = false;
    }
  }

  getDisplayName(): string {
    if (!this.user) {
      return '';
    }

    const fullName = `${this.user.firstName ?? ''} ${this.user.lastName ?? ''}`.trim();
    return fullName || this.user.email;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  private getPrimaryRole(): string | null {
    if (!this.user?.roles?.length) {
      return null;
    }

    return this.rolePriority.find(role => this.user!.roles.includes(role)) ?? this.user.roles[0] ?? null;
  }

  private buildMenuModel(): void {
    const primaryRole = this.getPrimaryRole();
    if (!this.user || !primaryRole) {
      this.menuModel = [];
      return;
    }

    const roleMenus: { [key: string]: MenuItem[] } = {
      ADMIN: [
        { label: 'Users', icon: 'pi pi-users', routerLink: '/admin/users' },
        { label: 'Admissions', icon: 'pi pi-user-plus', routerLink: '/admin/admissions' },
        { label: 'Classes', icon: 'pi pi-book', routerLink: '/admin/classes' },
        { label: 'Enrollment', icon: 'pi pi-id-card', routerLink: '/admin/enrollment' },
        { label: 'Guardian Links', icon: 'pi pi-link', routerLink: '/admin/guardian-links' },
        { label: 'Audit Logs', icon: 'pi pi-history', routerLink: '/admin/audit-logs' }
      ],
      TEACHER: [
        { label: 'My Classes', icon: 'pi pi-book', routerLink: '/teacher/classes' },
        { label: 'Homework', icon: 'pi pi-file-edit', routerLink: '/teacher/homework' },
        { label: 'Submissions', icon: 'pi pi-check-square', routerLink: '/teacher/submissions' },
        { label: 'Announcements', icon: 'pi pi-megaphone', routerLink: '/teacher/announcements' }
      ],
      STUDENT: [
        { label: 'Homework', icon: 'pi pi-file', routerLink: '/student/homework' },
        { label: 'My Submissions', icon: 'pi pi-send', routerLink: '/student/submissions' },
        { label: 'Announcements', icon: 'pi pi-megaphone', routerLink: '/student/announcements' },
        { label: 'Documents', icon: 'pi pi-folder', routerLink: '/student/documents' }
      ],
      GUARDIAN: [
        { label: 'Child Progress', icon: 'pi pi-chart-line', routerLink: '/guardian/progress' },
        { label: 'Homework Monitor', icon: 'pi pi-eye', routerLink: '/guardian/homework' },
        { label: 'Announcements', icon: 'pi pi-megaphone', routerLink: '/guardian/announcements' },
        { label: 'Documents', icon: 'pi pi-folder', routerLink: '/guardian/documents' }
      ]
    };

    this.menuModel = [
      {
        label: 'Navigation',
        items: [
          { label: 'Dashboard', icon: 'pi pi-home', routerLink: `/${primaryRole.toLowerCase()}` },
          ...(roleMenus[primaryRole] || [])
        ]
      }
    ];
  }

}

