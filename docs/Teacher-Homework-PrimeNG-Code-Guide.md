# Teacher Homework PrimeNG Code Guide

## Purpose
Use this guide to implement a production-ready Teacher Homework page with Angular standalone components and PrimeNG.

This version is aligned to the current project structure in `client/src/app/features/teacher/homework` and PrimeNG v20 usage (`p-select` from `primeng/select`).

## What You Will Build
- Teacher selects one of their classes
- Teacher sees homework list for selected class
- Teacher creates homework from a PrimeNG dialog
- Table supports sorting + pagination + clear empty/loading states
- Lightweight unit tests for key homework behavior

## Current Project Paths
- Existing list page: `client/src/app/features/teacher/homework/homework-list.component.ts`
- Existing create page: `client/src/app/features/teacher/homework/homework-create.component.ts`
- Teacher routes in `client/src/app/app.routes.ts`

## Backend Contract (expected)
Adjust service URLs if your backend differs:
- `GET /api/teacher/classes`
- `GET /api/teacher/homework?classId=...`
- `POST /api/teacher/homework`
- `DELETE /api/teacher/homework/{homeworkId}` (optional, if you support delete)

Example create request:

```json
{
  "classId": "cls-1",
  "title": "Algebra Practice",
  "description": "Complete questions 1-15",
  "dueDate": "2026-05-20"
}
```

## 1) Models
Create `client/src/app/features/teacher/homework/teacher-homework.models.ts`:

```ts
export interface TeacherClassDto {
  id: string;
  name: string;
  grade?: string;
}

export interface TeacherHomeworkDto {
  id: string;
  classId: string;
  title: string;
  description?: string;
  dueDate: string; // yyyy-MM-dd
  createdAt?: string;
}

export interface CreateTeacherHomeworkRequest {
  classId: string;
  title: string;
  description?: string;
  dueDate: string; // yyyy-MM-dd
}
```

## 2) Service
Create `client/src/app/features/teacher/homework/teacher-homework.service.ts`:

```ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateTeacherHomeworkRequest,
  TeacherClassDto,
  TeacherHomeworkDto
} from './teacher-homework.models';

@Injectable({ providedIn: 'root' })
export class TeacherHomeworkService {
  private readonly teacherApi = `${environment.apiBaseUrl}/teacher`;

  constructor(private readonly http: HttpClient) {}

  listClasses(): Observable<TeacherClassDto[]> {
    return this.http.get<TeacherClassDto[]>(`${this.teacherApi}/classes`);
  }

  listHomework(classId: string): Observable<TeacherHomeworkDto[]> {
    const params = new HttpParams().set('classId', classId);
    return this.http.get<TeacherHomeworkDto[]>(`${this.teacherApi}/homework`, { params });
  }

  createHomework(payload: CreateTeacherHomeworkRequest): Observable<TeacherHomeworkDto> {
    return this.http.post<TeacherHomeworkDto>(`${this.teacherApi}/homework`, payload);
  }

  deleteHomework(homeworkId: string): Observable<void> {
    return this.http.delete<void>(`${this.teacherApi}/homework/${homeworkId}`);
  }
}
```

## 3) PrimeNG Component (single-page flow)
Replace `client/src/app/features/teacher/homework/homework-list.component.ts` with:

```ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../shared/services/notification.service';
import {
  CreateTeacherHomeworkRequest,
  TeacherClassDto,
  TeacherHomeworkDto
} from './teacher-homework.models';
import { TeacherHomeworkService } from './teacher-homework.service';

@Component({
  selector: 'app-teacher-homework',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    InputTextareaModule,
    TagModule
  ],
  template: `
    <div class="page">
      <div class="header-row">
        <h2>Homework</h2>
        <button pButton type="button" label="Create Homework" icon="pi pi-plus" (click)="openCreateDialog()"></button>
      </div>

      <div class="filter-row">
        <p-select
          [options]="classOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select class"
          [showClear]="true"
          [(ngModel)]="selectedClassId"
          [ngModelOptions]="{ standalone: true }"
          (onChange)="onClassChanged($event.value)"
        ></p-select>
      </div>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <p-table [value]="homeworkRows" [loading]="loading" [paginator]="true" [rows]="10" sortField="dueDate" [sortOrder]="1">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="title">Title <p-sortIcon field="title"></p-sortIcon></th>
            <th pSortableColumn="dueDate">Due Date <p-sortIcon field="dueDate"></p-sortIcon></th>
            <th>Description</th>
            <th style="width: 150px">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>{{ row.title }}</td>
            <td><p-tag [severity]="dueSeverity(row.dueDate)" [value]="row.dueDate"></p-tag></td>
            <td>{{ row.description || '-' }}</td>
            <td>
              <button pButton type="button" label="Delete" severity="danger" size="small" [outlined]="true" [disabled]="loading" (click)="deleteHomework(row.id)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4">{{ selectedClassId ? 'No homework found for selected class.' : 'Select a class to load homework.' }}</td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog
        [(visible)]="dialogVisible"
        [modal]="true"
        [draggable]="false"
        [closable]="!loading"
        [style]="{ width: '38rem' }"
        header="Create Homework"
        (onHide)="closeDialog()"
      >
        <form [formGroup]="homeworkForm" (ngSubmit)="createHomework()" class="dialog-form">
          <label for="class">Class</label>
          <p-select
            inputId="class"
            [options]="classOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select class"
            formControlName="classId"
          ></p-select>

          <label for="title">Title</label>
          <input id="title" pInputText type="text" formControlName="title" placeholder="Homework title" />

          <label for="description">Description</label>
          <textarea id="description" pInputTextarea rows="4" formControlName="description" placeholder="Instructions"></textarea>

          <label for="dueDate">Due Date</label>
          <input id="dueDate" pInputText type="date" formControlName="dueDate" />

          <small class="field-error" *ngIf="homeworkForm.controls.title.touched && homeworkForm.controls.title.invalid">
            Title is required (minimum 3 characters).
          </small>
          <small class="field-error" *ngIf="homeworkForm.controls.dueDate.touched && homeworkForm.controls.dueDate.invalid">
            Due date is required.
          </small>
        </form>

        <ng-template pTemplate="footer">
          <button pButton type="button" label="Cancel" severity="secondary" [outlined]="true" [disabled]="loading" (click)="closeDialog()"></button>
          <button pButton type="button" label="Create" [loading]="loading" [disabled]="homeworkForm.invalid" (click)="createHomework()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; display: grid; gap: 1rem; }
    .header-row { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
    .filter-row { max-width: 340px; }
    .dialog-form { display: grid; gap: 0.45rem; }
    .dialog-form label { font-weight: 600; font-size: 0.9rem; margin-top: 0.35rem; }
    .field-error { color: #c62828; }
    .message.error { color: #c62828; margin: 0; }
    h2 { margin: 0; color: #1976d2; }
  `]
})
export class TeacherHomeworkComponent implements OnInit {
  classes: TeacherClassDto[] = [];
  classOptions: Array<{ label: string; value: string }> = [];
  homeworkRows: TeacherHomeworkDto[] = [];

  selectedClassId: string | null = null;
  loading = false;
  errorMessage = '';
  dialogVisible = false;

  homeworkForm: FormGroup<{
    classId: FormControl<string | null>;
    title: FormControl<string>;
    description: FormControl<string>;
    dueDate: FormControl<string | null>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly teacherHomeworkService: TeacherHomeworkService,
    private readonly notificationService: NotificationService
  ) {
    this.homeworkForm = this.fb.group({
      classId: this.fb.control<string | null>(null, Validators.required),
      title: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      description: this.fb.nonNullable.control(''),
      dueDate: this.fb.control<string | null>(null, Validators.required)
    });
  }

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.loading = true;
    this.errorMessage = '';

    this.teacherHomeworkService.listClasses()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (classes) => {
          this.classes = classes;
          this.classOptions = classes.map(c => ({ label: `${c.name} (${c.grade || '-'})`, value: c.id }));

          if (!this.selectedClassId && classes.length > 0) {
            this.selectedClassId = classes[0].id;
            this.loadHomeworkForSelectedClass();
          }
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load classes';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  onClassChanged(classId: string | null): void {
    this.selectedClassId = classId;
    this.loadHomeworkForSelectedClass();
  }

  loadHomeworkForSelectedClass(): void {
    if (!this.selectedClassId) {
      this.homeworkRows = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.teacherHomeworkService.listHomework(this.selectedClassId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (rows) => {
          this.homeworkRows = rows;
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load homework';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  openCreateDialog(): void {
    if (!this.selectedClassId) {
      this.notificationService.warning('Select a class first');
      return;
    }

    this.homeworkForm.reset({
      classId: this.selectedClassId,
      title: '',
      description: '',
      dueDate: null
    });
    this.dialogVisible = true;
  }

  createHomework(): void {
    if (this.homeworkForm.invalid) {
      this.homeworkForm.markAllAsTouched();
      return;
    }

    const raw = this.homeworkForm.getRawValue();
    const payload: CreateTeacherHomeworkRequest = {
      classId: raw.classId || '',
      title: raw.title.trim(),
      description: raw.description.trim() || undefined,
      dueDate: raw.dueDate || ''
    };

    this.loading = true;
    this.errorMessage = '';

    this.teacherHomeworkService.createHomework(payload)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: () => {
          this.notificationService.success('Homework created successfully');
          this.closeDialog();
          this.loadHomeworkForSelectedClass();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to create homework';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  deleteHomework(homeworkId: string): void {
    if (!confirm('Delete this homework?')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.teacherHomeworkService.deleteHomework(homeworkId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: () => {
          this.homeworkRows = this.homeworkRows.filter(r => r.id !== homeworkId);
          this.notificationService.success('Homework deleted successfully');
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to delete homework';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  closeDialog(): void {
    this.dialogVisible = false;
  }

  dueSeverity(dueDate: string): 'success' | 'warning' | 'danger' {
    const today = new Date().toISOString().slice(0, 10);
    if (dueDate < today) return 'danger';
    if (dueDate === today) return 'warning';
    return 'success';
  }
}

// Backward-compatible export for existing route imports.
export { TeacherHomeworkComponent as HomeworkListComponent };
```

## 4) Optional create-route compatibility
If you keep `/teacher/homework/create`, you can redirect it to the list page:

```ts
// client/src/app/features/teacher/homework/homework-create.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homework-create',
  standalone: true,
  template: ''
})
export class HomeworkCreateComponent {
  constructor(private readonly router: Router) {
    this.router.navigateByUrl('/teacher/homework');
  }
}
```

## 5) Route wiring
Current route file is `client/src/app/app.routes.ts`.

Recommended route setup:

```ts
{
  path: 'homework',
  loadComponent: () => import('./features/teacher/homework/homework-list.component')
    .then(m => m.TeacherHomeworkComponent)
},
{
  path: 'homework/create',
  loadComponent: () => import('./features/teacher/homework/homework-list.component')
    .then(m => m.TeacherHomeworkComponent)
}
```

## 6) Targeted spec (optional but recommended)
Create `client/src/app/features/teacher/homework/homework-list.component.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { TeacherHomeworkComponent } from './homework-list.component';
import { TeacherHomeworkService } from './teacher-homework.service';
import { NotificationService } from '../../../shared/services/notification.service';

function createComponent(): TeacherHomeworkComponent {
  const serviceMock: Partial<TeacherHomeworkService> = {
    listClasses: () => of([]),
    listHomework: () => of([]),
    createHomework: () => of({ id: 'h1', classId: 'c1', title: 'T', dueDate: '2026-05-20' }),
    deleteHomework: () => of(void 0)
  };

  const notificationMock: Partial<NotificationService> = {
    success: () => void 0,
    error: () => void 0,
    warning: () => void 0,
    info: () => void 0
  };

  return new TeacherHomeworkComponent(
    new FormBuilder(),
    serviceMock as TeacherHomeworkService,
    notificationMock as NotificationService
  );
}

describe('TeacherHomeworkComponent', () => {
  it('returns warning severity when due today', () => {
    const c = createComponent();
    const today = new Date().toISOString().slice(0, 10);
    expect(c.dueSeverity(today)).toBe('warning');
  });
});
```

## 7) Copilot prompt starters

```text
1) Implement Teacher Homework PrimeNG page
Implement docs/Teacher-Homework-PrimeNG-Code-Guide.md section 3 by replacing client/src/app/features/teacher/homework/homework-list.component.ts and keep backward export alias.

2) Add teacher homework service and models
Create teacher-homework.models.ts and teacher-homework.service.ts exactly as in the guide.

3) Wire teacher homework routes
Update client/src/app/app.routes.ts so /teacher/homework and /teacher/homework/create both load TeacherHomeworkComponent.
```

## Last Updated
- 2026-05-12
