# Admin Setup Pages PrimeNG Code Guide

## Purpose
Use this guide to implement and maintain Admin setup pages in the School Portal with PrimeNG (Angular standalone components).

This guide is aligned to the current project structure and component naming:
- `AdminClassesComponent` in `client/src/app/features/admin/classes/classes-list.component.ts`
- `AdminEnrollmentsComponent` in `client/src/app/features/admin/enrollment/enrollment.component.ts`
- `GuardianLinksComponent` in `client/src/app/features/admin/guardian-links/guardian-links.component.ts` (legacy HTML controls; migration target included below)

## PrimeNG Version Note
This project uses PrimeNG APIs compatible with:
- `SelectModule` from `primeng/select`
- `<p-select>` in templates

Do not use `primeng/dropdown` / `<p-dropdown>` unless your installed PrimeNG version supports it.

## Backend Endpoint Shape Used By Current Services
Current service files indicate this API shape:
- `GET    /api/admin/classes`
- `POST   /api/admin/classes`
- `PUT    /api/admin/classes/{id}`
- `DELETE /api/admin/classes/{id}`
- `GET    /api/admin/enrollments`
- `POST   /api/admin/enrollments`
- `POST   /api/admin/enrollments/remove`
- `GET    /api/admin/students`
- `GET    /api/admin/guardians`
- `GET    /api/admin/guardian-links`
- `POST   /api/admin/guardian-links`
- `POST   /api/admin/guardian-links/remove`

## 1) AdminClassesComponent (Current PrimeNG Pattern)

Use this as the baseline pattern for table + dialog + teacher assignment.

```ts
// client/src/app/features/admin/classes/classes-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AdminClass, ClassesAdminService, UpsertAdminClassRequest } from './classes-admin.service';
import { AdminUser, UsersAdminService } from '../users/users-admin.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-admin-classes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  template: `
    <div class="page">
      <div class="header-row">
        <h2>Classes Management</h2>
        <div class="header-actions">
          <button pButton type="button" label="Create Class" icon="pi pi-plus" (click)="openCreateDialog()"></button>
        </div>
      </div>

      <p-table [value]="classRows" [loading]="loading" [paginator]="true" [rows]="10" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Grade</th>
            <th>Teacher</th>
            <th>Students</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-schoolClass>
          <tr>
            <td>{{ schoolClass.name }}</td>
            <td>{{ schoolClass.grade || '-' }}</td>
            <td>{{ teacherLabel(schoolClass) }}</td>
            <td>{{ schoolClass.studentIds?.length || 0 }}</td>
            <td>
              <button pButton type="button" label="Edit" severity="secondary" size="small" (click)="openEditDialog(schoolClass)"></button>
              <button pButton type="button" label="Assign Teacher" size="small" (click)="openAssignTeacherDialog(schoolClass)"></button>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog
        [(visible)]="dialogVisible"
        [modal]="true"
        [draggable]="false"
        [style]="{ width: '34rem' }"
        [header]="teacherOnlyMode ? 'Assign Teacher' : (editingId ? 'Edit Class' : 'Create Class')"
        (onHide)="closeDialog()"
      >
        <form [formGroup]="classForm" class="dialog-form">
          <label for="name">Class Name</label>
          <input id="name" pInputText type="text" formControlName="name" [readonly]="teacherOnlyMode" />

          <label for="grade">Grade</label>
          <input id="grade" pInputText type="text" formControlName="grade" [readonly]="teacherOnlyMode" />

          <label for="teacher">Teacher</label>
          <p-select
            inputId="teacher"
            [options]="teacherOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select teacher (optional)"
            formControlName="teacherId"
            [showClear]="true"
          ></p-select>
        </form>
      </p-dialog>
    </div>
  `
})
export class AdminClassesComponent implements OnInit {
  // ...existing code...
}
```

## 2) AdminEnrollmentsComponent (Current PrimeNG Pattern)

This component is now class-aware and filters the student dropdown so only students not already enrolled in the selected class are visible.

```html
<!-- client/src/app/features/admin/enrollment/enrollment.component.ts template excerpt -->
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
```

```ts
// client/src/app/features/admin/enrollment/enrollment.component.ts method excerpt
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
```

## 3) Guardian Links (PrimeNG Current Pattern)

`GuardianLinksComponent` is now PrimeNG-based in `client/src/app/features/admin/guardian-links/guardian-links.component.ts`.

Behavior expectations:
- guardian must be selected first
- student options are filtered to exclude already-linked students for the selected guardian
- unlink action uses row-level loading (`unlinkingKey`) instead of blocking all rows

Use the file as source of truth if this snippet drifts.

```ts
// client/src/app/features/admin/guardian-links/guardian-links.component.ts
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
          placeholder="Select guardian"
        ></p-select>

        <p-select
          formControlName="studentId"
          [options]="studentOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select student"
        ></p-select>

        <button pButton type="submit" label="Link Guardian" icon="pi pi-link" [loading]="loading" [disabled]="loading || linkForm.invalid"></button>
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
                <button pButton type="button" label="Unlink" severity="danger" size="small" [outlined]="true" [disabled]="loading" (click)="unlinkGuardian(link.id, studentId)"></button>
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
    .form-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.6rem; }
    .link-row { display: flex; align-items: center; justify-content: space-between; gap: 0.7rem; margin-bottom: 0.4rem; }
    .message.error { color: #c62828; margin: 0; }
  `]
})
export class GuardianLinksComponent implements OnInit {
  guardians: GuardianSummary[] = [];
  students: StudentSummary[] = [];
  guardianLinks: GuardianLinkItem[] = [];

  guardianOptions: Array<{ label: string; value: string }> = [];
  studentOptions: Array<{ label: string; value: string }> = [];

  loading = false;
  errorMessage = '';

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
        this.studentOptions = students.map(s => ({ label: this.studentLabel(s), value: s.id }));
      },
      error: () => {
        this.errorMessage = this.errorMessage || 'Failed to load students';
      }
    });

    this.guardianLinksService.listGuardianLinks()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (links) => { this.guardianLinks = links; },
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
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to link guardian';
        }
      });
  }

  unlinkGuardian(guardianId: string, studentId: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.guardianLinksService.unlinkGuardian(guardianId, studentId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (updated) => {
          this.guardianLinks = this.guardianLinks.map(item => item.id === updated.id ? updated : item);
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to unlink guardian';
        }
      });
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
}
```

## 4) Route Wiring Reference

```ts
// client/src/app/app.routes.ts
{
  path: 'classes',
  loadComponent: () => import('./features/admin/classes/classes-list.component')
    .then(m => m.AdminClassesComponent)
},
{
  path: 'enrollment',
  loadComponent: () => import('./features/admin/enrollment/enrollment.component')
    .then(m => m.AdminEnrollmentsComponent)
},
{
  path: 'guardian-links',
  loadComponent: () => import('./features/admin/guardian-links/guardian-links.component')
    .then(m => m.GuardianLinksComponent)
}
```

## 5) Implementation Checklist

- [ ] Keep `SelectModule` + `<p-select>` usage consistent across all three pages.
- [ ] Keep API base usage as `${environment.apiBaseUrl}/admin/...` (no duplicate `/api/api`).
- [ ] Preserve row-level action loading for remove/unlink operations.
- [ ] For enrollments, keep class-first filtering so only eligible students appear.
- [ ] For guardian links, keep guardian-first filtering so only eligible (not linked) students appear.
- [ ] Keep backward-compatible exports if route imports depend on existing names.

## 6) Copilot Prompt Starters

```text
1) Keep Guardian Links filter behavior
Ensure GuardianLinksComponent keeps guardian-first selection, excludes already-linked students from the student dropdown, and uses row-level unlink loading.

2) Keep Enrollment filter behavior
Ensure AdminEnrollmentsComponent keeps class-based student filtering (exclude already enrolled students and clear invalid selection when class changes).

3) Keep Classes page consistent
Ensure AdminClassesComponent continues to use p-table + p-dialog + p-select and preserve existing filtering, sorting, and session table state.
```

## Last Updated
- 2026-05-12
