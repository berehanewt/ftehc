import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="public-page">
      <div class="public-card">
        <div class="back-link">
          <a routerLink="/login">← Back to Login</a>
        </div>

        <h1>Contact Us</h1>
        <p class="intro">
          We are here to help. Reach out to us using any of the contact options below.
        </p>

        <div class="contact-grid">
          <div class="contact-card">
            <div class="icon">📧</div>
            <h3>General Inquiries</h3>
            <p>For general questions about the school.</p>
            <a href="mailto:info@ftehcschool.com">info&#64;ftehcschool.com</a>
          </div>

          <div class="contact-card">
            <div class="icon">🎓</div>
            <h3>Admissions Office</h3>
            <p>For enrollment, registration, and new student inquiries.</p>
            <a href="mailto:admissions@ftehcschool.com">admissions&#64;ftehcschool.com</a>
          </div>

          <div class="contact-card">
            <div class="icon">🛠️</div>
            <h3>Technical Support</h3>
            <p>For portal login issues, account problems, or technical help.</p>
            <a href="mailto:support@ftehcschool.com">support&#64;ftehcschool.com</a>
          </div>

          <div class="contact-card">
            <div class="icon">👩‍💼</div>
            <h3>Administration</h3>
            <p>For teacher or staff-related matters and school policy questions.</p>
            <a href="mailto:admin@ftehcschool.com">admin&#64;ftehcschool.com</a>
          </div>
        </div>

        <section class="section">
          <h2>🕐 Office Hours</h2>
          <ul>
            <li>Monday – Friday: 7:30 AM – 4:30 PM</li>
            <li>We typically respond to emails within 1 business day.</li>
          </ul>
        </section>

        <div class="cta">
          <p>Need to enroll a student or teacher?</p>
          <a routerLink="/admissions" class="cta-button">View Admissions</a>
          &nbsp;
          <a routerLink="/our-school" class="cta-button secondary">About Our School</a>
        </div>
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
    }
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
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .contact-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.5rem;
    }
    .icon { font-size: 1.75rem; margin-bottom: 0.5rem; }
    h3 { font-size: 1.05rem; color: #1e293b; margin-bottom: 0.4rem; }
    p { color: #64748b; font-size: 0.92rem; margin-bottom: 0.5rem; line-height: 1.5; }
    a { color: #3b82f6; font-size: 0.9rem; }
    .section { margin-bottom: 2rem; }
    h2 { font-size: 1.2rem; color: #1e293b; margin-bottom: 0.75rem; }
    ul { padding-left: 1.25rem; color: #475569; line-height: 2; }
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
    .cta-button.secondary { background: #16a34a; }
    .cta-button.secondary:hover { background: #15803d; }
  `]
})
export class ContactComponent {}

