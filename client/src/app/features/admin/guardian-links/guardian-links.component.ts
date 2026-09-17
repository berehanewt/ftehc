import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import {
  GuardianLinksAdminService,
  GuardianLinkItem,
  GuardianSummary,
  StudentSummary
} from './guardian-links-admin.service';

@Component({
  selector: 'app-guardian-links',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, SelectModule, ButtonModule],
  template: `
    <div class="page">
      <h2>Guardian Links</h2>

      <form [formGroup]="linkForm" (ngSubmit)="linkGuardian()" class="form-row">
        <p-select
          formControlName="guardianId"
          [options]="guardianOptions"
          optionLabel="label"
          optionValue="value"
          (onChange)="onGuardianChange()"
          placeholder="Select guardian"
        ></p-select>

        <p-select
          formControlName="studentId"
          [options]="studentOptions"
          optionLabel="label"
          optionValue="value"
          [disabled]="!linkForm.controls.guardianId.value"
          [emptyMessage]="linkForm.controls.guardianId.value ? 'No eligible students left for this guardian' : 'Select a guardian first'"
          placeholder="Select student"
        ></p-select>

        <small class="hint" *ngIf="linkForm.controls.guardianId.value">
          Eligible students: {{ studentOptions.length }}
        </small>

        <button
          pButton
          type="submit"
          label="Link Guardian"
          icon="pi pi-link"
          [loading]="loading"
          [disabled]="loading || linkForm.invalid"
        ></button>
      </form>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <p-table [value]="guardianLinks" [loading]="loading" [paginator]="true" [rows]="10" dataKey="id" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Guardian</th>
            <th>Relationship</th>
            <th>Linked Students</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-link>
          <tr>
            <td>{{ guardianNameById(link.id) }}</td>
            <td>{{ guardianRelationshipById(link.id) || '-' }}</td>
            <td>
              <div class="link-row" *ngFor="let studentId of link.studentIds">
                <span>{{ studentNameById(studentId) }}</span>
                <button
                  pButton
                  type="button"
                  label="Unlink"
                  severity="danger"
                  size="small"
                  [outlined]="true"
                  [loading]="isUnlinking(link.id, studentId)"
                  [disabled]="isUnlinking(link.id, studentId) || loading"
                  (click)="unlinkGuardian(link.id, studentId)"
                ></button>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="3">No guardian links found.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; display: grid; gap: 1rem; }
    h2 { color: #1976d2; margin: 0; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 0.6rem;
    }
    .hint { color: #6b7280; }
    .link-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.7rem;
      margin-bottom: 0.4rem;
    }
    .message.error { color: #c62828; margin: 0; }
  `]
})
export class GuardianLinksComponent implements OnInit {
  guardians: GuardianSummary[] = [];
  students: StudentSummary[] = [];
  guardianLinks: GuardianLinkItem[] = [];

  guardianOptions: Array<{ label: string; value: string }> = [];
  allStudentOptions: Array<{ label: string; value: string }> = [];
  studentOptions: Array<{ label: string; value: string }> = [];

  loading = false;
  errorMessage = '';
  unlinkingKey: string | null = null;

  linkForm: FormGroup<{
    guardianId: FormControl<string | null>;
    studentId: FormControl<string | null>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly guardianLinksService: GuardianLinksAdminService
  ) {
    this.linkForm = this.fb.group({
      guardianId: this.fb.control<string | null>(null, Validators.required),
      studentId: this.fb.control<string | null>(null, Validators.required)
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.guardianLinksService.listGuardians().subscribe({
      next: (guardians) => {
        this.guardians = guardians;
        this.guardianOptions = guardians.map(g => ({ label: this.guardianLabel(g), value: g.id }));
      },
      error: () => {
        this.errorMessage = this.errorMessage || 'Failed to load guardians';
      }
    });

    this.guardianLinksService.listStudents().subscribe({
      next: (students) => {
        this.students = students;
        this.allStudentOptions = students.map(s => ({ label: this.studentLabel(s), value: s.id }));
        this.updateStudentOptions();
      },
      error: () => {
        this.errorMessage = this.errorMessage || 'Failed to load students';
      }
    });

    this.guardianLinksService.listGuardianLinks()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (links) => {
          this.guardianLinks = links;
          this.updateStudentOptions();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load guardian links';
        }
      });
  }

  linkGuardian(): void {
    if (this.linkForm.invalid) {
      return;
    }

    const guardianId = this.linkForm.value.guardianId || '';
    const studentId = this.linkForm.value.studentId || '';

    this.loading = true;
    this.errorMessage = '';

    this.guardianLinksService.linkGuardian(guardianId, studentId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (updated) => {
          this.guardianLinks = this.guardianLinks.map(item => item.id === updated.id ? updated : item);
          if (!this.guardianLinks.find(item => item.id === updated.id)) {
            this.guardianLinks.push(updated);
          }
          this.linkForm.patchValue({ studentId: null });
          this.updateStudentOptions();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to link guardian';
        }
      });
  }

  unlinkGuardian(guardianId: string, studentId: string): void {
    this.unlinkingKey = `${guardianId}:${studentId}`;
    this.errorMessage = '';

    this.guardianLinksService.unlinkGuardian(guardianId, studentId)
      .pipe(finalize(() => { this.unlinkingKey = null; }))
      .subscribe({
        next: (updated) => {
          this.guardianLinks = this.guardianLinks.map(item => item.id === updated.id ? updated : item);
          this.updateStudentOptions();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to unlink guardian';
        }
      });
  }

  onGuardianChange(): void {
    this.updateStudentOptions();
  }

  isUnlinking(guardianId: string, studentId: string): boolean {
    return this.unlinkingKey === `${guardianId}:${studentId}`;
  }

  guardianLabel(guardian: GuardianSummary): string {
    const relationship = guardian.relationship || 'Guardian';
    return `${guardian.id} (${relationship})`;
  }

  studentLabel(student: StudentSummary): string {
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    return fullName ? `${fullName} (${student.grade || '-'})` : `${student.id} (${student.grade || '-'})`;
  }

  guardianNameById(id: string): string {
    const guardian = this.guardians.find(g => g.id === id);
    return guardian ? guardian.id : id;
  }

  guardianRelationshipById(id: string): string | undefined {
    return this.guardians.find(g => g.id === id)?.relationship;
  }

  studentNameById(id: string): string {
    const student = this.students.find(s => s.id === id);
    return student ? this.studentLabel(student) : id;
  }

  private updateStudentOptions(): void {
    const selectedGuardianId = this.linkForm.controls.guardianId.value;
    if (!selectedGuardianId) {
      this.studentOptions = [];
      if (this.linkForm.controls.studentId.value) {
        this.linkForm.patchValue({ studentId: null });
      }
      return;
    }

    const selectedLink = this.guardianLinks.find(link => link.id === selectedGuardianId);
    const linkedStudentIds = new Set(selectedLink?.studentIds ?? []);

    this.studentOptions = this.allStudentOptions.filter(option => !linkedStudentIds.has(option.value));

    const selectedStudentId = this.linkForm.controls.studentId.value;
    if (selectedStudentId && !this.studentOptions.some(option => option.value === selectedStudentId)) {
      this.linkForm.patchValue({ studentId: null });
    }
  }
}
