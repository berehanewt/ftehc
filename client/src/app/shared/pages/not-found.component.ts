import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="not-found">
      <h1>404</h1>
      <p>The page you are looking for does not exist.</p>
      <a routerLink="/" class="btn">Go to Dashboard</a>
    </div>
  `,
  styles: [`
    .not-found {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;

      h1 {
        font-size: 4rem;
        color: #1976d2;
        margin: 0;
      }

      p {
        color: #666;
        font-size: 1.1rem;
        margin: 1rem 0;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        background-color: #1976d2;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin-top: 1rem;

        &:hover {
          background-color: #1565c0;
        }
      }
    }
  `]
})
export class NotFoundComponent {}

