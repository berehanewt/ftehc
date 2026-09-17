import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="reset-password-container">
      <div class="reset-password-card">
        <h1>Reset Password</h1>
        <p>Enter your new password below.</p>

        <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="form">
          <div class="form-group">
            <label for="password">New Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="form-control"
              placeholder="Enter new password"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              class="form-control"
              placeholder="Confirm password"
            />
          </div>

          <button type="submit" class="submit-button" [disabled]="resetPasswordForm.invalid || loading">
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>

        <p class="back-link">
          <a href="/login">Back to Login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .reset-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }

    .reset-password-card {
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
export class ResetPasswordComponent {
  resetPasswordForm;
  loading = false;
  token: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private notification: NotificationService
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      const password = this.resetPasswordForm.get('password')?.value;
      const confirmPassword = this.resetPasswordForm.get('confirmPassword')?.value;

      if (password !== confirmPassword) {
        this.notification.error('Passwords do not match');
        return;
      }

      this.loading = true;
      // Call backend API here
      setTimeout(() => {
        this.loading = false;
        this.notification.success('Password reset successful!');
      }, 1000);
    }
  }
}

