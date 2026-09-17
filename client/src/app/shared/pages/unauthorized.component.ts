import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized">
      <h1>403</h1>
      <p>You do not have permission to access this page.</p>
      <a routerLink="/" class="btn">Go to Dashboard</a>
    </div>
  `,
  styles: [`
    .unauthorized {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;

      h1 {
        font-size: 4rem;
        color: #d32f2f;
        margin: 0;
      }

      p {
        color: #666;
        font-size: 1.1rem;
        margin: 1rem 0;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        background-color: #d32f2f;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin-top: 1rem;

        &:hover {
          background-color: #c62828;
        }
      }
    }
  `]
})
export class UnauthorizedComponent {}

