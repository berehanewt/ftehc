import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-our-school',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="public-page">
      <a class="a11y-skip-link" href="#our-school-main">Skip to school information</a>

      <div id="our-school-main" class="public-card" tabindex="-1" aria-label="Our School information">
        <div class="back-link">
          <a routerLink="/login">← Back to Login</a>
        </div>

        <h1>Our School</h1>
        <p class="intro">
          FTEHC School is committed to providing a quality education in a safe and supportive
          environment. Learn more about our mission, programs, and values.
        </p>

        <section class="section">
          <h2>🏫 About FTEHC</h2>
          <p>
            Founded with the goal of empowering every student, FTEHC School offers a modern,
            technology-assisted learning experience for students from kindergarten through
            high school graduation.
          </p>
        </section>

        <section class="section">
          <h2>📚 Academic Programs</h2>
          <ul>
            <li>Core Curriculum: Math, Science, English, and Social Studies</li>
            <li>STEM electives and coding workshops</li>
            <li>Arts and physical education programs</li>
            <li>Advanced placement options for qualified students</li>
            <li>Personalized learning plans for special needs students</li>
          </ul>
        </section>

        <section class="section">
          <h2>🕐 School Hours</h2>
          <ul>
            <li>Monday – Friday: 8:00 AM – 3:30 PM</li>
            <li>After-school program: 3:30 PM – 6:00 PM (optional)</li>
            <li>Administrative office: 7:30 AM – 4:30 PM</li>
          </ul>
        </section>

        <section class="section">
          <h2>🌟 Our Values</h2>
          <ul>
            <li>Excellence in teaching and learning</li>
            <li>Inclusive and respectful school community</li>
            <li>Partnership between families and educators</li>
            <li>Growth mindset and lifelong learning</li>
          </ul>
        </section>

        <div class="cta">
          <p>Want to know more or schedule a visit?</p>
          <a href="mailto:info@ftehcschool.com" class="cta-button">Email Us</a>
          &nbsp;
          <a routerLink="/admissions" class="cta-button secondary">View Admissions</a>
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
      position: relative;
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
    .section { margin-bottom: 2rem; }
    h2 { font-size: 1.25rem; color: #1e293b; margin-bottom: 0.75rem; }
    p { color: #475569; line-height: 1.7; }
    ul { padding-left: 1.25rem; color: #475569; line-height: 2; }
    a { color: #3b82f6; }
    .cta { background: #f0fdf4; border-radius: 8px; padding: 1.5rem; text-align: center; margin-top: 2rem; }
    .cta p { margin-bottom: 1rem; color: #1e293b; font-weight: 500; }
    .cta-button {
      display: inline-block;
      background: #16a34a;
      color: white;
      padding: 0.65rem 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }
    .cta-button:hover { background: #15803d; }
    .cta-button.secondary { background: #3b82f6; }
    .cta-button.secondary:hover { background: #2563eb; }
  `]
})
export class OurSchoolComponent {}

