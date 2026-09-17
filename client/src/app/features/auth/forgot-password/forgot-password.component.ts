import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <h1>Forgot Password?</h1>
        <p>Enter your email address and we'll send you a link to reset your password.</p>

        <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="form-control"
              placeholder="Enter your email"
            />
          </div>

          <button type="submit" class="submit-button" [disabled]="forgotPasswordForm.invalid || loading">
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>

        <p class="back-link">
          <a href="/login">Back to Login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }

    .forgot-password-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;

      h1 {
        color: #1976d2;
        text-align: center;
        margin-bottom: 1rem;
      }

      p {
        text-align: center;
        color: #666;
        margin-bottom: 1.5rem;
      }

      .form {
        .form-group {
          margin-bottom: 1.5rem;

          label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
          }

          .form-control {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;

            &:focus {
              outline: none;
              border-color: #1976d2;
            }
          }
        }

        .submit-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;

          &:hover:not(:disabled) {
            background-color: #1565c0;
          }

          &:disabled {
            background-color: #ccc;
          }
        }
      }

      .back-link {
        text-align: center;
        margin-top: 1.5rem;

        a {
          color: #1976d2;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  `]
})
export class ForgotPasswordComponent {
  forgotPasswordForm;
  loading = false;

  constructor(private fb: FormBuilder, private notification: NotificationService) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.loading = true;
      // Call backend API here
      setTimeout(() => {
        this.loading = false;
        this.notification.success('Reset link sent to your email!');
      }, 1000);
    }
  }
}

