import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdmissionsEnrollmentComponent } from '../../admin/admissions/admissions-enrollment.component';

@Component({
  selector: 'app-admissions',
  standalone: true,
  imports: [CommonModule, RouterLink, AdmissionsEnrollmentComponent],
  template: `
    <div class="public-page">
      <a
        class="a11y-skip-link"
        href="#admissions-enrollment"
        (click)="scrollToEnrollment($event)"
      >
        Skip to Admissions Enrollment
      </a>

      <button
        type="button"
        class="hamburger-button"
        [class.open]="showQuickLinksMenu"
        (click)="toggleQuickLinksMenu()"
        aria-label="Open quick links menu"
        [attr.aria-expanded]="showQuickLinksMenu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="menu-overlay" *ngIf="showQuickLinksMenu" (click)="closeQuickLinksMenu()"></div>

      <aside class="quick-links-menu" [class.open]="showQuickLinksMenu" aria-label="Quick Links">
        <div class="menu-header">
          <h3>Quick Links</h3>
          <button type="button" class="menu-close" (click)="closeQuickLinksMenu()" aria-label="Close quick links menu">
            &times;
          </button>
        </div>

        <div class="menu-item">
          <strong>Admissions</strong>
          <a routerLink="/admissions" (click)="closeQuickLinksMenu()">View Admissions</a>
        </div>

        <div class="menu-item">
          <strong>Our School</strong>
          <a routerLink="/our-school" (click)="closeQuickLinksMenu()">View School Info</a>
        </div>

        <div class="menu-item">
          <strong>Contact Us</strong>
          <a routerLink="/contact" (click)="closeQuickLinksMenu()">Contact Us</a>
        </div>

        <div class="menu-item">
          <strong>Login</strong>
          <a routerLink="/login" (click)="closeQuickLinksMenu()">Back to Login</a>
        </div>
      </aside>

      <div class="public-card">
        <div class="back-link">
          <a routerLink="/login">← Back to Login</a>
        </div>

        <h1>Admissions</h1>
        <p class="intro">
          Welcome to FTEHC School! We are happy to enroll new students, guardians, and teachers.
          Please review the information below to get started.
        </p>

        <section class="section">
          <h2><a class="section-jump-link" href="#admissions-enrollment" (click)="scrollToEnrollment($event)">🎓 Student Enrollment</a></h2>
          <ul>
            <li>Students must be enrolled by a parent or guardian.</li>
            <li>Required information: student full name, age, and gender.</li>
            <li>Optional: grade/class level and previous academic history.</li>
            <li>Grade placement is determined by age and prior academic history.</li>
            <li>Required documents: birth certificate and immunization records.</li>
            <li>Email: <a href="mailto:admissions@ftehcschool.com">admissions&#64;ftehcschool.com</a></li>
          </ul>
        </section>

        <section class="section">
          <h2><a class="section-jump-link" href="#admissions-enrollment" (click)="scrollToEnrollment($event)">👨‍👩‍👧 Guardian / Family Registration</a></h2>
          <ul>
            <li>Guardians must be linked to at least one enrolled student.</li>
            <li>Required information: guardian full name, telephone number, and email address.</li>
            <li>Optional: spouse/co-guardian full name and relationship to student.</li>
            <li>A guardian account grants access to homework, grades, and announcements.</li>
            <li>Contact the school office to register — the admin will enroll you and your child together.</li>
            <li>Email: <a href="mailto:admissions@ftehcschool.com">admissions&#64;ftehcschool.com</a></li>
          </ul>
        </section>

        <section class="section">
          <h2>👩‍🏫 Teacher Onboarding</h2>
          <ul>
            <li>Teacher accounts are created by school administrators.</li>
            <li>Submit your qualifications and subject preferences to the admin office.</li>
            <li>Once approved, your account credentials will be emailed to you.</li>
            <li>Email: <a href="mailto:admissions@ftehcschool.com">admissions&#64;ftehcschool.com</a></li>
          </ul>
        </section>

        <section
          id="admissions-enrollment"
          #admissionsEnrollmentSection
          class="section"
          tabindex="-1"
          aria-label="Admissions Enrollment"
        >
          <h2>📝 Register Guardian & Student</h2>
          <p class="intro">
            Use the form below to register a guardian and student account directly.
          </p>
          <app-admin-admissions-enrollment [requireAdmin]="false"></app-admin-admissions-enrollment>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .public-page {
      min-height: 100vh;
      background: #f4f6f9;
      display: flex;
      justify-content: center;
      padding: 2rem 1rem;
      position: relative;
    }
    .hamburger-button {
      position: fixed;
      top: 1rem;
      left: 1rem;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      padding: 0 11px;
      cursor: pointer;
      z-index: 1200;
    }
    .hamburger-button span {
      display: block;
      height: 2px;
      border-radius: 2px;
      background: #fff;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    .hamburger-button.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
    .hamburger-button.open span:nth-child(2) { opacity: 0; }
    .hamburger-button.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
    .menu-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.42);
      z-index: 1100;
    }
    .quick-links-menu {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: min(86vw, 320px);
      background: #fff;
      box-shadow: 6px 0 24px rgba(15, 23, 42, 0.2);
      padding: 1rem;
      transform: translateX(-105%);
      transition: transform 0.22s ease-in-out;
      z-index: 1201;
    }
    .quick-links-menu.open { transform: translateX(0); }
    .menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.9rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .menu-header h3 { margin: 0; color: #1565c0; font-size: 1rem; }
    .menu-close {
      border: 0;
      background: transparent;
      font-size: 1.7rem;
      color: #64748b;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .menu-item {
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .menu-item strong {
      display: block;
      color: #0f172a;
      margin-bottom: 0.3rem;
      font-size: 0.92rem;
    }
    .menu-item a {
      color: #1976d2;
      text-decoration: none;
      font-size: 0.85rem;
    }
    .menu-item a:hover { text-decoration: underline; }
    .public-card {
      background: white;
      border-radius: 12px;
      padding: 2.5rem;
      max-width: 760px;
      width: 100%;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .back-link { margin-bottom: 1.5rem; }
    .back-link a { color: #3b82f6; text-decoration: none; font-size: 0.95rem; }
    .back-link a:hover { text-decoration: underline; }
    h1 { font-size: 2rem; color: #1e293b; margin-bottom: 0.5rem; }
    .intro { color: #64748b; margin-bottom: 2rem; font-size: 1.05rem; }
    .section { margin-bottom: 2rem; }
    #admissions-enrollment { scroll-margin-top: 1rem; }
    h2 { font-size: 1.25rem; color: #1e293b; margin-bottom: 0.75rem; }
    .section-jump-link { color: inherit; text-decoration: underline; }
    .section-jump-link:hover { color: #2563eb; }
    ul { padding-left: 1.25rem; color: #475569; line-height: 2; }
    a { color: #3b82f6; }
    .cta { background: #eff6ff; border-radius: 8px; padding: 1.5rem; text-align: center; margin-top: 2rem; }
    .cta p { margin-bottom: 1rem; color: #1e293b; font-weight: 500; }
    .cta-button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 0.65rem 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }
    .cta-button:hover { background: #2563eb; }
  `]
})
export class AdmissionsComponent {
  @ViewChild('admissionsEnrollmentSection', { static: true }) admissionsEnrollmentSection?: ElementRef<HTMLElement>;

  showQuickLinksMenu = false;

  toggleQuickLinksMenu(): void {
    this.showQuickLinksMenu = !this.showQuickLinksMenu;
  }

  closeQuickLinksMenu(): void {
    this.showQuickLinksMenu = false;
  }

  scrollToEnrollment(event: Event): void {
    event.preventDefault();
    const target = this.admissionsEnrollmentSection?.nativeElement ?? document.getElementById('admissions-enrollment');
    if (!target) {
      return;
    }

    window.history.replaceState(null, '', '#admissions-enrollment');
    const targetTop = target.getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });

    // Keep keyboard users in context by shifting focus to the target section after scrolling.
    window.setTimeout(() => {
      if (typeof (target as HTMLElement).focus === 'function') {
        (target as HTMLElement).focus({ preventScroll: true });
      }
    }, 300);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeQuickLinksMenu();
  }
}



