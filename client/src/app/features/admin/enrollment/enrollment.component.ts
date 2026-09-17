import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, startWith, takeUntil } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { EnrollmentAdminService, EnrollmentClass, EnrollmentStudent } from './enrollment-admin.service';
import { NotificationService } from '../../../shared/services/notification.service';

type EnrollmentClassRow = EnrollmentClass & { studentLabels: string[] };

@Component({
  selector: 'app-admin-enrollments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, SelectModule, ButtonModule],
  template: `
    <div class="page">
      <div class="header-row">
        <h2>Enrollment Management</h2>
      </div>

      <form [formGroup]="enrollmentForm" (ngSubmit)="enrollStudent()" class="assign-form">
        <p-select
          formControlName="classId"
          [options]="classOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select class"
        ></p-select>

        <p-select
          formControlName="studentId"
          [options]="studentOptions"
          optionLabel="label"
          optionValue="value"
          [disabled]="!enrollmentForm.controls.classId.value"
          [emptyMessage]="enrollmentForm.controls.classId.value ? 'No eligible students left for this class' : 'Select a class first'"
          placeholder="Select student"
        ></p-select>

        <button pButton type="submit" label="Assign Student" icon="pi pi-user-plus" [loading]="loading" [disabled]="loading || enrollmentForm.invalid"></button>
      </form>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <p-table [value]="classRows" [loading]="loading" [paginator]="true" [rows]="10" responsiveLayout="scroll" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th>Class</th>
            <th>Grade</th>
            <th>Students Enrolled</th>
            <th style="width: 45%">Assigned Students</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-c>
          <tr>
            <td>{{ c.name }}</td>
            <td>{{ c.grade || '-' }}</td>
            <td>{{ c.studentIds.length }}</td>
            <td>
              <div *ngIf="c.studentIds.length > 0; else noStudents" class="students-cell">
                <div class="student-row" *ngFor="let studentId of c.studentIds">
                  <span>{{ studentNameById(studentId) }}</span>
                  <button
                    pButton
                    type="button"
                    label="Remove"
                    severity="danger"
                    size="small"
                    [outlined]="true"
                    [loading]="isRemoving(c.id, studentId)"
                    [disabled]="loading"
                    (click)="removeStudent(c.id, studentId)"
                  ></button>
                </div>
              </div>
              <ng-template #noStudents>
                <span class="muted">No students assigned.</span>
              </ng-template>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4">No classes available.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; display: grid; gap: 1rem; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    h2 { color: #1976d2; margin: 0; }
    .assign-form {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 0.6rem;
    }
    .students-cell { display: grid; gap: 0.45rem; }
    .student-row { display: flex; align-items: center; justify-content: space-between; gap: 0.7rem; }
    .muted { color: #6b7280; }
    .message.error { color: #c62828; margin: 0; }
  `]
})
export class AdminEnrollmentsComponent implements OnInit, OnDestroy {
  classes: EnrollmentClass[] = [];
  classRows: EnrollmentClassRow[] = [];
  students: EnrollmentStudent[] = [];
  classOptions: Array<{ label: string; value: string }> = [];
  studentOptions: Array<{ label: string; value: string }> = [];

  loading = false;
  errorMessage = '';
  removingKey: string | null = null;
  private readonly destroy$ = new Subject<void>();

  enrollmentForm: FormGroup<{
    classId: FormControl<string | null>;
    studentId: FormControl<string | null>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly enrollmentAdminService: EnrollmentAdminService,
    private readonly notificationService: NotificationService
  ) {
    this.enrollmentForm = this.fb.group({
      classId: this.fb.control<string | null>(null, Validators.required),
      studentId: this.fb.control<string | null>(null, Validators.required)
    });
  }

  ngOnInit(): void {
    this.enrollmentForm.controls.classId.valueChanges
      .pipe(startWith(this.enrollmentForm.controls.classId.value), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateStudentOptions();
      });

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.enrollmentAdminService.listClasses()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (classes) => {
          this.classes = classes;
          this.classOptions = classes.map(c => ({
            label: `${c.name} (${c.grade || '-'})`,
            value: c.id
          }));
          this.rebuildClassRows();
          this.updateStudentOptions();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load enrollments';
          this.notificationService.error(this.errorMessage);
        }
      });

    this.enrollmentAdminService.listStudents()
      .subscribe({
        next: (students) => {
          this.students = students;
          this.updateStudentOptions();
          this.rebuildClassRows();
        },
        error: () => {
          this.errorMessage = this.errorMessage || 'Failed to load students';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  enrollStudent(): void {
    if (this.enrollmentForm.invalid) {
      return;
    }

    const classId = this.enrollmentForm.value.classId || '';
    const studentId = this.enrollmentForm.value.studentId || '';

    this.loading = true;
    this.errorMessage = '';

    this.enrollmentAdminService.enrollStudent(classId, studentId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (updatedClass) => {
          this.classes = this.classes.map(c => c.id === updatedClass.id ? updatedClass : c);
          this.rebuildClassRows();
          this.enrollmentForm.patchValue({ studentId: null });
          this.updateStudentOptions();
          this.notificationService.success('Student assigned to class');
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to enroll student';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  removeStudent(classId: string, studentId: string): void {
    this.loading = true;
    this.removingKey = `${classId}:${studentId}`;
    this.errorMessage = '';

    this.enrollmentAdminService.removeStudent(classId, studentId)
      .pipe(finalize(() => {
        this.loading = false;
        this.removingKey = null;
      }))
      .subscribe({
        next: (updatedClass) => {
          this.classes = this.classes.map(c => c.id === updatedClass.id ? updatedClass : c);
          this.rebuildClassRows();
          this.updateStudentOptions();
          this.notificationService.success('Student removed from class');
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to remove student';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  isRemoving(classId: string, studentId: string): boolean {
    return this.loading && this.removingKey === `${classId}:${studentId}`;
  }

  studentLabel(student: EnrollmentStudent): string {
    const firstName = student.firstName || '';
    const lastName = student.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName ? `${fullName} (${student.grade || '-'})` : `${student.id} (${student.grade || '-'})`;
  }

  studentNameById(studentId: string): string {
    const student = this.students.find(s => s.id === studentId);
    if (!student) {
      return studentId;
    }
    return this.studentLabel(student);
  }

  private rebuildClassRows(): void {
    this.classRows = this.classes.map(c => ({
      ...c,
      studentLabels: c.studentIds.map(studentId => this.studentNameById(studentId))
    }));
  }

  private updateStudentOptions(): void {
    const selectedClassId = this.enrollmentForm.controls.classId.value;
    if (!selectedClassId) {
      this.studentOptions = [];
      if (this.enrollmentForm.controls.studentId.value) {
        this.enrollmentForm.patchValue({ studentId: null });
      }
      return;
    }

    const selectedClass = this.classes.find(c => c.id === selectedClassId);
    const enrolledStudentIds = new Set(selectedClass?.studentIds ?? []);

    this.studentOptions = this.students
      .filter(student => !enrolledStudentIds.has(student.id))
      .map(student => ({
        label: this.studentLabel(student),
        value: student.id
      }));

    const selectedStudentId = this.enrollmentForm.controls.studentId.value;
    if (selectedStudentId && !this.studentOptions.some(option => option.value === selectedStudentId)) {
      this.enrollmentForm.patchValue({ studentId: null });
    }
  }
}

// Backward-compatible export for existing route imports.
export { AdminEnrollmentsComponent as EnrollmentComponent };
