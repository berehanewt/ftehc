import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm;
  loading = false;
  showQuickLinksMenu = false;

  @ViewChild('firstQuickLink') firstQuickLink?: ElementRef<HTMLAnchorElement>;
  @ViewChild('hamburgerButton') hamburgerButton?: ElementRef<HTMLButtonElement>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.navigateToDashboard();
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.notification.error('Please fill in all fields correctly');
      return;
    }

    this.loading = true;
    this.authService.login(this.loginForm.value as any).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success('Login successful!');
        this.navigateToDashboard();
      },
      error: (error) => {
        this.loading = false;
        this.notification.error(error.error?.message || 'Login failed');
      }
    });
  }

  toggleQuickLinksMenu(): void {
    this.showQuickLinksMenu = !this.showQuickLinksMenu;
    if (this.showQuickLinksMenu) {
      this.focusFirstQuickLink();
    }
  }

  closeQuickLinksMenu(): void {
    const wasOpen = this.showQuickLinksMenu;
    this.showQuickLinksMenu = false;

    if (wasOpen) {
      setTimeout(() => this.hamburgerButton?.nativeElement.focus(), 0);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeQuickLinksMenu();
  }

  private navigateToDashboard(): void {
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    if (redirectUrl && redirectUrl !== '/' && redirectUrl !== '/login') {
      sessionStorage.removeItem('redirectUrl');
      this.router.navigateByUrl(redirectUrl);
      return;
    }

    sessionStorage.removeItem('redirectUrl');

    const user = this.authService.getUser();
    if (!user || !user.roles || user.roles.length === 0) {
      this.loading = false;
      this.notification.error('Your account has no assigned role. Contact an administrator.');
      return;
    }

    const rolePriority = ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'] as const;
    const targetRole = rolePriority.find(role => user.roles.includes(role)) ?? user.roles[0];
    const dashboard = `/${targetRole.toLowerCase()}`;

    this.router.navigateByUrl(dashboard);
  }

  private focusFirstQuickLink(): void {
    setTimeout(() => this.firstQuickLink?.nativeElement.focus(), 0);
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
