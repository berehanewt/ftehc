import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import {
  AdmissionsAdminService,
  AdmissionsEnrollResponse,
  GuardianEmailCheckResponse
} from './admissions-admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-admissions-enrollment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CardModule,
    DividerModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>
          <i class="pi pi-user-plus"></i>
          Admissions Enrollment
        </h2>
        <p class="subtitle">Register a guardian/family and link them to their student in one step.</p>
      </div>

      <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="message error"   *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="message warning" *ngIf="validationMessage">{{ validationMessage }}</p>
      <p class="message warning" *ngIf="requireAdmin && !isAdmin">
        Admissions enrollment is admin-only. Please sign in with an ADMIN account.
      </p>

      <!-- Enrollment Result -->
      <div class="result-card" *ngIf="enrollResult">
        <h3>✅ Enrollment Complete</h3>
        <div class="result-grid">
          <div class="result-item">
            <strong>Guardian Account</strong>
            <p>Email: {{ enrollResult.guardian.email }}</p>
            <p>Name: {{ enrollResult.guardian.fullName || '—' }}</p>
            <p>Phone: {{ enrollResult.guardian.phone || '—' }}</p>
            <p *ngIf="enrollResult.guardian.spouseFullName">
              Spouse: {{ enrollResult.guardian.spouseFullName }}
            </p>
          </div>
          <div class="result-item">
            <strong>Student Account</strong>
            <p>Email: {{ enrollResult.student.email }}</p>
            <p>Name: {{ enrollResult.student.firstName }} {{ enrollResult.student.lastName }}</p>
            <p>Age: {{ enrollResult.student.age || '—' }}</p>
            <p>Gender: {{ enrollResult.student.gender || '—' }}</p>
          </div>
        </div>
        <button pButton type="button" label="Enroll Another Student" icon="pi pi-refresh"
                severity="secondary" (click)="resetForm()"></button>
      </div>

      <form *ngIf="!enrollResult && canUseEnrollment" [formGroup]="enrollForm" (ngSubmit)="submit()" class="enroll-form">

        <!-- Guardian / Family Section -->
        <p-card styleClass="section-card">
          <ng-template pTemplate="header">
            <div class="section-header">
              <i class="pi pi-users section-icon"></i>
              <span>Guardian / Family Information</span>
            </div>
          </ng-template>

          <div class="fields-grid">
            <div class="field-group">
              <label for="guardianFirstName">Guardian First Name <span class="required">*</span></label>
              <input
                pInputText
                id="guardianFirstName"
                type="text"
                placeholder="e.g. Tesfaye"
                formControlName="guardianFirstName"
              />
              <small class="field-error" *ngIf="hasError('guardianFirstName')">
                Guardian first name is required.
              </small>
            </div>

            <div class="field-group">
              <label for="guardianMiddleName">Guardian Middle Name</label>
              <input
                pInputText
                id="guardianMiddleName"
                type="text"
                placeholder="e.g. Mohamed (optional)"
                formControlName="guardianMiddleName"
              />
            </div>

            <div class="field-group">
              <label for="guardianLastName">Guardian Last Name <span class="required">*</span></label>
              <input
                pInputText
                id="guardianLastName"
                type="text"
                placeholder="e.g. Haile"
                formControlName="guardianLastName"
              />
              <small class="field-error" *ngIf="hasError('guardianLastName')">
                Guardian last name is required.
              </small>
            </div>

            <div class="field-group">
              <label for="guardianPhone">Telephone Number <span class="required">*</span></label>
              <input
                pInputText
                id="guardianPhone"
                type="tel"
                placeholder="e.g. +251 91 234 5678"
                formControlName="guardianPhone"
              />
              <small class="field-error" *ngIf="hasError('guardianPhone')">
                Phone number is required.
              </small>
            </div>

            <div class="field-group">
              <label for="guardianEmail">Email Address <span class="required">*</span></label>
              <input
                pInputText
                id="guardianEmail"
                type="email"
                placeholder="guardian@example.com"
                formControlName="guardianEmail"
                (blur)="onGuardianEmailBlur()"
              />
              <small class="field-error" *ngIf="hasError('guardianEmail', 'required')">
                Email is required.
              </small>
              <small class="field-error" *ngIf="hasError('guardianEmail', 'email')">
                Enter a valid email address.
              </small>
              <small class="field-help" *ngIf="!hasError('guardianEmail', 'required') && !hasError('guardianEmail', 'email')">
                {{
                  requireAdmin
                    ? 'If this email already exists (for example ADMIN/TEACHER), admissions can upgrade it to include GUARDIAN.'
                    : 'Use a new guardian email on this public page. Existing staff/admin emails must be enrolled from Admin Admissions.'
                }}
              </small>
              <small class="field-help" *ngIf="checkingGuardianEmail">Checking guardian email...</small>
              <small class="field-help" [class.field-help-warn]="guardianEmailInfoType === 'warn'" *ngIf="guardianEmailInfoMessage">
                {{ guardianEmailInfoMessage }}
              </small>
            </div>

            <div class="field-group">
              <label for="guardianSpouseFirstName">Spouse First Name</label>
              <input
                pInputText
                id="guardianSpouseFirstName"
                type="text"
                placeholder="e.g. Marta (optional)"
                formControlName="guardianSpouseFirstName"
              />
            </div>

            <div class="field-group">
              <label for="guardianSpouseMiddleName">Spouse Middle Name</label>
              <input
                pInputText
                id="guardianSpouseMiddleName"
                type="text"
                placeholder="e.g. Ahmed (optional)"
                formControlName="guardianSpouseMiddleName"
              />
            </div>

            <div class="field-group">
              <label for="guardianSpouseLastName">Spouse Last Name</label>
              <input
                pInputText
                id="guardianSpouseLastName"
                type="text"
                placeholder="e.g. Tesfaye (optional)"
                formControlName="guardianSpouseLastName"
              />
            </div>

            <div class="field-group">
              <label for="guardianRelationship">Relationship to Student</label>
              <p-select
                inputId="guardianRelationship"
                formControlName="guardianRelationship"
                [options]="relationshipOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select relationship"
              ></p-select>
            </div>

            <div class="field-group">
              <label for="guardianPassword">Portal Password <span class="required">*</span></label>
              <input
                pInputText
                id="guardianPassword"
                type="password"
                placeholder="Minimum 6 characters"
                formControlName="guardianPassword"
              />
              <small class="field-error" *ngIf="hasError('guardianPassword', 'required')">
                Password is required.
              </small>
              <small class="field-error" *ngIf="hasError('guardianPassword', 'minlength')">
                Password must be at least 6 characters.
              </small>
            </div>
          </div>
        </p-card>

        <p-divider></p-divider>

        <!-- Student Section -->
        <p-card styleClass="section-card">
          <ng-template pTemplate="header">
            <div class="section-header">
              <i class="pi pi-graduation-cap section-icon"></i>
              <span>Student Information</span>
            </div>
          </ng-template>

          <div class="fields-grid">
            <div class="field-group">
              <label for="studentFirstName">Student First Name <span class="required">*</span></label>
              <input
                pInputText
                id="studentFirstName"
                type="text"
                placeholder="First name"
                formControlName="studentFirstName"
              />
              <small class="field-error" *ngIf="hasError('studentFirstName')">
                First name is required.
              </small>
            </div>

            <div class="field-group">
              <label for="studentMiddleName">Student Middle Name</label>
              <input
                pInputText
                id="studentMiddleName"
                type="text"
                placeholder="Middle name (optional)"
                formControlName="studentMiddleName"
              />
            </div>

            <div class="field-group">
              <label for="studentLastName">Student Last Name <span class="required">*</span></label>
              <input
                pInputText
                id="studentLastName"
                type="text"
                placeholder="Last name"
                formControlName="studentLastName"
              />
              <small class="field-error" *ngIf="hasError('studentLastName')">
                Last name is required.
              </small>
            </div>

            <div class="field-group">
              <label for="studentAge">Age <span class="required">*</span></label>
              <input
                pInputText
                id="studentAge"
                type="number"
                min="3"
                max="25"
                placeholder="e.g. 12"
                formControlName="studentAge"
              />
              <small class="field-error" *ngIf="hasError('studentAge', 'required')">
                Age is required.
              </small>
              <small class="field-error" *ngIf="hasError('studentAge', 'min') || hasError('studentAge', 'max')">
                Age must be between 3 and 25.
              </small>
            </div>

            <div class="field-group">
              <label for="studentGender">Gender <span class="required">*</span></label>
              <p-select
                inputId="studentGender"
                formControlName="studentGender"
                [options]="genderOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select gender"
              ></p-select>
              <small class="field-error" *ngIf="hasError('studentGender')">
                Gender is required.
              </small>
            </div>

            <div class="field-group">
              <label for="studentGrade">Grade / Class Level</label>
              <input
                pInputText
                id="studentGrade"
                type="text"
                placeholder="e.g. Grade 7 (optional)"
                formControlName="studentGrade"
              />
            </div>

            <div class="field-group">
              <label for="studentPassword">Student Portal Password <span class="required">*</span></label>
              <input
                pInputText
                id="studentPassword"
                type="password"
                placeholder="Minimum 6 characters"
                formControlName="studentPassword"
              />
              <small class="field-error" *ngIf="hasError('studentPassword', 'required')">
                Password is required.
              </small>
              <small class="field-error" *ngIf="hasError('studentPassword', 'minlength')">
                Password must be at least 6 characters.
              </small>
            </div>
          </div>
        </p-card>

        <div class="form-actions">
          <button
            pButton
            type="submit"
            label="Enroll Guardian &amp; Student"
            icon="pi pi-check"
            [loading]="loading"
            [disabled]="loading || isSubmitBlocked"
          ></button>
          <button
            pButton
            type="button"
            label="Reset Form"
            icon="pi pi-refresh"
            severity="secondary"
            [outlined]="true"
            [disabled]="loading"
            (click)="resetForm()"
          ></button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page {
      padding: 1.5rem;
      display: grid;
      gap: 1.25rem;
      max-width: 900px;
    }
    .page-header { display: grid; gap: 0.25rem; }
    h2 {
      color: #1565c0;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.5rem;
    }
    .subtitle { color: #64748b; margin: 0; }
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f0f7ff;
      border-radius: 8px 8px 0 0;
      font-weight: 600;
      font-size: 1rem;
      color: #0d47a1;
    }
    .section-icon { font-size: 1.1rem; color: #1976d2; }
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.1rem;
      padding: 0.5rem 0;
    }
    .full-width { grid-column: span 2; }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    label {
      font-size: 0.88rem;
      font-weight: 500;
      color: #374151;
    }
    .required { color: #dc2626; }
    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="number"],
    input[type="password"] {
      padding: 0.55rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.9rem;
      width: 100%;
      box-sizing: border-box;
    }
    input:focus { border-color: #1976d2; outline: none; box-shadow: 0 0 0 2px rgba(25,118,210,0.15); }
    .field-error { color: #dc2626; font-size: 0.78rem; }
    .field-help { color: #64748b; font-size: 0.76rem; }
    .field-help-warn { color: #b45309; }
    .form-actions {
      display: flex;
      gap: 0.75rem;
      padding-top: 0.5rem;
    }
    .message { margin: 0; padding: 0.75rem 1rem; border-radius: 6px; }
    .message.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .message.error   { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .message.warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .result-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 1.5rem;
      display: grid;
      gap: 1rem;
    }
    .result-card h3 { margin: 0; color: #166534; font-size: 1.1rem; }
    .result-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .result-item {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid #d1fae5;
    }
    .result-item strong { display: block; color: #065f46; margin-bottom: 0.5rem; }
    .result-item p { margin: 0.2rem 0; font-size: 0.88rem; color: #374151; }
    @media (max-width: 640px) {
      .fields-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: span 1; }
      .result-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdmissionsEnrollmentComponent {
  @Input() requireAdmin = true;

  loading = false;
  successMessage = '';
  errorMessage = '';
  validationMessage = '';
  enrollResult: AdmissionsEnrollResponse | null = null;
  checkingGuardianEmail = false;
  guardianEmailInfoMessage = '';
  guardianEmailInfoType: 'info' | 'warn' = 'info';
  guardianEmailStatus: GuardianEmailCheckResponse['status'] | null = null;
  readonly isAdmin: boolean;

  readonly genderOptions = [
    { label: 'Female', value: 'FEMALE' },
    { label: 'Male', value: 'MALE' }
  ];

  readonly relationshipOptions = [
    { label: 'Mother', value: 'Mother' },
    { label: 'Father', value: 'Father' },
    { label: 'Guardian', value: 'Guardian' },
    { label: 'Aunt', value: 'Aunt' },
    { label: 'Uncle', value: 'Uncle' },
    { label: 'Grandmother', value: 'Grandmother' },
    { label: 'Grandfather', value: 'Grandfather' },
    { label: 'Other', value: 'Other' }
  ];

  enrollForm: ReturnType<FormBuilder['group']>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly admissionsService: AdmissionsAdminService,
    private readonly authService: AuthService
  ) {
    this.isAdmin = this.authService.hasRole('ADMIN');
    this.enrollForm = this.fb.group({
       // Guardian
       guardianFirstName: ['', Validators.required],
       guardianMiddleName: [''],
       guardianLastName: ['', Validators.required],
       guardianPhone: ['', Validators.required],
       guardianEmail: ['', [Validators.required, Validators.email]],
       guardianPassword: ['', [Validators.required, Validators.minLength(6)]],
       guardianSpouseFirstName: [''],
       guardianSpouseMiddleName: [''],
       guardianSpouseLastName: [''],
       guardianRelationship: [''],
       // Student
       studentFirstName: ['', Validators.required],
       studentMiddleName: [''],
       studentLastName: ['', Validators.required],
       studentAge: [null as number | null, [Validators.required, Validators.min(3), Validators.max(25)]],
       studentGender: ['', Validators.required],
       studentGrade: [''],
       studentPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get canUseEnrollment(): boolean {
    return !this.requireAdmin || this.isAdmin;
  }

  get isSubmitBlocked(): boolean {
    if (this.requireAdmin) {
      return false;
    }

    return this.guardianEmailStatus === 'EXISTING_NON_GUARDIAN' || this.guardianEmailStatus === 'EXISTING_STUDENT';
  }

  hasError(controlName: string, errorCode?: string): boolean {
    const control = this.enrollForm.get(controlName);
    if (!control || !(control.touched || control.dirty) || control.valid) {
      return false;
    }
    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  submit(): void {
    if (!this.canUseEnrollment) {
      this.errorMessage = 'Forbidden: only ADMIN users can enroll guardian and student accounts.';
      return;
    }

    if (this.enrollForm.invalid) {
      this.validationMessage = 'Please fill all required fields and fix validation errors before submitting.';
      this.enrollForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitBlocked) {
      this.errorMessage = this.guardianEmailInfoMessage ||
        'This guardian email cannot be used on public admissions. Use a new guardian email or enroll from Admin Admissions.';
      return;
    }

    const v = this.enrollForm.getRawValue();
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.validationMessage = '';

     const enrollRequest = {
       guardianFirstName: v.guardianFirstName!,
       guardianMiddleName: v.guardianMiddleName || undefined,
       guardianLastName: v.guardianLastName!,
       guardianPhone: v.guardianPhone!,
       guardianEmail: v.guardianEmail!,
       guardianPassword: v.guardianPassword!,
       guardianSpouseFirstName: v.guardianSpouseFirstName || undefined,
       guardianSpouseMiddleName: v.guardianSpouseMiddleName || undefined,
       guardianSpouseLastName: v.guardianSpouseLastName || undefined,
       guardianRelationship: v.guardianRelationship || undefined,
       studentFirstName: v.studentFirstName!,
       studentMiddleName: v.studentMiddleName || undefined,
       studentLastName: v.studentLastName!,
       studentPassword: v.studentPassword!,
       studentGender: v.studentGender!,
       studentAge: v.studentAge ?? undefined,
       studentGrade: v.studentGrade || undefined
     };

     const enrollCall$ = this.requireAdmin
       ? this.admissionsService.enroll(enrollRequest)
       : this.admissionsService.enrollPublic(enrollRequest);

     enrollCall$
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
         next: (result) => {
           this.enrollResult = result;
           const studentName = [v.studentFirstName, v.studentMiddleName, v.studentLastName]
             .filter(n => n && n.trim())
             .join(' ');
           const guardianName = [v.guardianFirstName, v.guardianMiddleName, v.guardianLastName]
             .filter(n => n && n.trim())
             .join(' ');
           this.successMessage =
             `Successfully enrolled ${studentName} ` +
             `and linked to guardian ${guardianName}.`;
         },
        error: (err) => {
          this.errorMessage = this.extractErrorMessage(err);
        }
      });
  }

  onGuardianEmailBlur(): void {
    const emailControl = this.enrollForm.get('guardianEmail');
    const email = (emailControl?.value || '').trim().toLowerCase();

    this.guardianEmailInfoMessage = '';
    this.guardianEmailStatus = null;
    if (!email || emailControl?.invalid) {
      return;
    }

    this.checkingGuardianEmail = true;
    this.admissionsService.checkGuardianEmail(email)
      .pipe(finalize(() => { this.checkingGuardianEmail = false; }))
      .subscribe({
        next: (result) => {
          this.applyGuardianEmailStatusHint(result);
        },
        error: () => {
          this.guardianEmailInfoType = 'warn';
          this.guardianEmailInfoMessage = 'Could not verify email right now. You can still submit the form.';
        }
      });
  }

  private applyGuardianEmailStatusHint(result: GuardianEmailCheckResponse): void {
    this.guardianEmailStatus = result.status;
    switch (result.status) {
      case 'NEW_EMAIL':
        this.guardianEmailInfoType = 'info';
        this.guardianEmailInfoMessage = 'Email is available for new guardian enrollment.';
        return;
      case 'EXISTING_GUARDIAN':
        this.guardianEmailInfoType = 'info';
        this.guardianEmailInfoMessage = 'Existing guardian found. You can enroll another student under this guardian.';
        return;
      case 'EXISTING_STUDENT':
        this.guardianEmailInfoType = 'warn';
        this.guardianEmailInfoMessage = 'This email belongs to a student account and cannot be used as guardian.';
        return;
      case 'EXISTING_NON_GUARDIAN':
        this.guardianEmailInfoType = 'warn';
        this.guardianEmailInfoMessage = this.requireAdmin
          ? 'Existing non-guardian account found. Admin admissions can upgrade it to include GUARDIAN.'
          : 'Existing staff/admin account found. Use a new guardian email here or enroll from Admin Admissions.';
        return;
      default:
        this.guardianEmailInfoType = 'info';
        this.guardianEmailInfoMessage = result.message || '';
    }
  }

   private extractErrorMessage(err: unknown): string {
     const fallback = 'Enrollment failed. Please check the details and try again.';

     if (err instanceof HttpErrorResponse) {
       if (typeof err.error === 'string' && err.error.trim()) {
         return err.error;
       }

        const body = err.error as { message?: string; detail?: string; error?: string; title?: string; errors?: Record<string, string> } | null;
        const message = (body?.message || body?.detail || body?.error || body?.title || '').trim();
        const normalizedMessage = message.toLowerCase();

       // If there are field-level validation errors, show them
       if (body?.errors && Object.keys(body.errors).length > 0) {
         const fieldErrors = Object.entries(body.errors)
           .map(([field, msg]) => `${field}: ${msg}`)
           .join(' | ');
         return `Validation error: ${fieldErrors}`;
       }

       if (err.status === 409) {
          if (normalizedMessage.includes('non-guardian')) {
            return this.requireAdmin
                ? 'Email conflict: this email exists under another role. In Admin Admissions it can be upgraded to include GUARDIAN. If this still fails, refresh and retry.'
                : 'Email conflict: this email belongs to an existing non-guardian account. On the public page, use a new guardian email, or ask admin to enroll from Admin Admissions.';
          }

          if (normalizedMessage.includes('already in use')) {
            return 'Email conflict: this guardian email is already in use. Use a different email or use the same existing guardian account to add another student.';
          }

          if (normalizedMessage.includes('student account')) {
            return 'Email conflict: this email belongs to a student account and cannot be used as guardian.';
         }

          if (message) {
            return message;
          }

         return 'Conflict: this guardian or student record already exists with incompatible details.';
       }

        if (message) {
          return message;
        }

       if (err.status === 400) {
         return 'Bad Request: Check that all required fields are filled correctly and match the required format.';
       }

       if (err.status === 403) {
         return 'Forbidden: your account does not have ADMIN permission for admissions enrollment. Please sign in with an admin account.';
       }

       if (err.status === 401) {
         return 'Unauthorized: your session is invalid or expired. Please sign in again and retry.';
       }

       if (err.status === 0) {
         return 'Network error: cannot reach the server. Please confirm backend is running on localhost:8080 and try again.';
       }

       if (err.status >= 500) {
         return 'Server error: enrollment request reached the server but failed internally. Please retry in a moment.';
       }

       return fallback;
     }

     return fallback;
   }

  resetForm(): void {
    this.enrollResult = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.validationMessage = '';
    this.checkingGuardianEmail = false;
    this.guardianEmailInfoMessage = '';
    this.guardianEmailInfoType = 'info';
    this.guardianEmailStatus = null;
    this.enrollForm.reset();
  }
}

