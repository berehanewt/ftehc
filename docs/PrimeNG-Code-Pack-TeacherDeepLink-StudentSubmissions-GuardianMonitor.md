# PrimeNG Code Pack - Teacher Deep Link, Student Submissions, Guardian Monitor

## Purpose
This guide provides a complete PrimeNG code pack for three connected flows:

1. Teacher deep-link from homework rows to submissions review
2. Student submissions page (self-view)
3. Guardian homework monitor page (linked-student tracking)

It is aligned to your current app structure and route file:
- `client/src/app/app.routes.ts`
- `client/src/app/features/teacher/homework/homework-list.component.ts`
- `client/src/app/features/teacher/submissions/submissions-list.component.ts`
- `client/src/app/features/student/...`
- `client/src/app/features/guardian/...`

Use PrimeNG v20-style components (`p-select`, `primeng/select`).

## Backend Contract (expected)
Adjust endpoint names if your backend differs.

### Teacher
- `GET /api/teacher/classes`
- `GET /api/teacher/homework?classId=...`
- `GET /api/teacher/submissions?homeworkId=...`
- `PATCH /api/teacher/submissions/{submissionId}`

### Student
- `GET /api/student/submissions`
- `GET /api/student/submissions/files/{fileKey}` (optional)

### Guardian
- `GET /api/guardian/students`
- `GET /api/guardian/homework?studentId=...`

## 1) Teacher Deep-Link: Homework -> Submissions

### A) Add row-level deep-link button in teacher homework table
Update `client/src/app/features/teacher/homework/homework-list.component.ts`.

```ts
// imports
import { Router } from '@angular/router';

// constructor
constructor(
  private readonly fb: FormBuilder,
  private readonly teacherHomeworkService: TeacherHomeworkService,
  private readonly notificationService: NotificationService,
  private readonly router: Router
) {
  // ...existing code...
}

// method
goToSubmissions(homeworkId: string): void {
  this.router.navigate(['/teacher/submissions'], {
    queryParams: {
      classId: this.selectedClassId,
      homeworkId
    }
  });
}
```

Template action column button:

```html
<button
  pButton
  type="button"
  label="Submissions"
  icon="pi pi-inbox"
  size="small"
  severity="secondary"
  [outlined]="true"
  (click)="goToSubmissions(row.id)"
></button>
```

### B) Read deep-link params in teacher submissions page
Update `client/src/app/features/teacher/submissions/submissions-list.component.ts`.

```ts
// imports
import { ActivatedRoute } from '@angular/router';

// fields
private deepLinkedClassId: string | null = null;
private deepLinkedHomeworkId: string | null = null;

// constructor
constructor(
  private readonly fb: FormBuilder,
  private readonly teacherHomeworkService: TeacherHomeworkService,
  private readonly teacherSubmissionsService: TeacherSubmissionsService,
  private readonly notificationService: NotificationService,
  private readonly route: ActivatedRoute
) {
  // ...existing code...
}

ngOnInit(): void {
  const qp = this.route.snapshot.queryParamMap;
  this.deepLinkedClassId = qp.get('classId');
  this.deepLinkedHomeworkId = qp.get('homeworkId');

  if (this.deepLinkedClassId) {
    this.selectedClassId = this.deepLinkedClassId;
  }

  this.loadClasses();
}
```

Inside `loadHomeworkForClass(...)`, preserve deep-linked homework when available:

```ts
const preferredHomeworkId = this.deepLinkedHomeworkId;
const preferred = preferredHomeworkId
  ? rows.find(h => h.id === preferredHomeworkId)
  : null;

if (preferred) {
  this.selectedHomeworkId = preferred.id;
  this.deepLinkedHomeworkId = null;
  this.loadSubmissions(preferred.id);
} else if (rows.length > 0) {
  this.selectedHomeworkId = rows[0].id;
  this.loadSubmissions(rows[0].id);
}
```

## 2) Student Submissions (PrimeNG)

### A) Models
Create `client/src/app/features/student/submissions/student-submissions.models.ts`:

```ts
export type StudentSubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED';

export interface StudentSubmissionFileDto {
  fileKey: string;
  fileName: string;
  contentType?: string;
  size?: number;
}

export interface StudentSubmissionDto {
  id: string;
  homeworkId: string;
  homeworkTitle?: string;
  className?: string;
  submittedAt?: string;
  status: StudentSubmissionStatus;
  text?: string;
  files?: StudentSubmissionFileDto[];
  grade?: number;
  feedback?: string;
}
```

### B) Service
Create `client/src/app/features/student/submissions/student-submissions.service.ts`:

```ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StudentSubmissionDto } from './student-submissions.models';

@Injectable({ providedIn: 'root' })
export class StudentSubmissionsService {
  private readonly studentApi = `${environment.apiBaseUrl}/student`;

  constructor(private readonly http: HttpClient) {}

  listMySubmissions(homeworkId?: string): Observable<StudentSubmissionDto[]> {
    let params = new HttpParams();
    if (homeworkId) {
      params = params.set('homeworkId', homeworkId);
    }
    return this.http.get<StudentSubmissionDto[]>(`${this.studentApi}/submissions`, { params });
  }

  downloadFile(fileKey: string): Observable<Blob> {
    return this.http.get(`${this.studentApi}/submissions/files/${fileKey}`, { responseType: 'blob' });
  }
}
```

### C) Component
Create `client/src/app/features/student/submissions/student-submissions.component.ts`:

```ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../shared/services/notification.service';
import { StudentSubmissionDto, StudentSubmissionStatus } from './student-submissions.models';
import { StudentSubmissionsService } from './student-submissions.service';

@Component({
  selector: 'app-student-submissions',
  standalone: true,
  imports: [CommonModule, TableModule, DialogModule, ButtonModule, TagModule],
  template: `
    <div class="page">
      <h2>My Submissions</h2>

      <p-table [value]="rows" [loading]="loading" [paginator]="true" [rows]="10" sortField="submittedAt" [sortOrder]="-1">
        <ng-template pTemplate="header">
          <tr>
            <th>Homework</th>
            <th>Status</th>
            <th>Submitted</th>
            <th style="width: 120px">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>{{ row.homeworkTitle || row.homeworkId }}</td>
            <td><p-tag [severity]="statusSeverity(row.status)" [value]="row.status"></p-tag></td>
            <td>{{ row.submittedAt || '-' }}</td>
            <td>
              <button pButton type="button" label="View" icon="pi pi-eye" size="small" [outlined]="true" (click)="open(row)"></button>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{ width: '42rem' }" header="Submission Details" (onHide)="close()">
        <ng-container *ngIf="selected as sub">
          <div class="section-title">{{ sub.homeworkTitle || sub.homeworkId }}</div>
          <div class="text-block">{{ sub.text || '-' }}</div>

          <div *ngIf="sub.files?.length">
            <div class="section-title">Files</div>
            <div class="file-row" *ngFor="let file of sub.files">
              <span>{{ file.fileName }}</span>
              <button pButton type="button" icon="pi pi-download" label="Download" size="small" [outlined]="true" (click)="download(file.fileKey, file.fileName)"></button>
            </div>
          </div>

          <div *ngIf="sub.feedback || sub.grade !== undefined">
            <div class="section-title">Teacher Feedback</div>
            <div><b>Grade:</b> {{ sub.grade ?? '-' }}</div>
            <div class="text-block">{{ sub.feedback || '-' }}</div>
          </div>
        </ng-container>
      </p-dialog>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; display: grid; gap: 1rem; }
    h2 { margin: 0; color: #1976d2; }
    .section-title { font-weight: 600; margin-bottom: 0.4rem; margin-top: 0.5rem; }
    .text-block { background: #f7f8fa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.7rem; white-space: pre-wrap; margin-bottom: 0.6rem; }
    .file-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; gap: 0.6rem; }
  `]
})
export class StudentSubmissionsComponent implements OnInit {
  rows: StudentSubmissionDto[] = [];
  loading = false;
  dialogVisible = false;
  selected: StudentSubmissionDto | null = null;

  constructor(
    private readonly service: StudentSubmissionsService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.listMySubmissions()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (rows) => { this.rows = rows; },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to load submissions';
          this.notificationService.error(msg);
        }
      });
  }

  open(row: StudentSubmissionDto): void {
    this.selected = row;
    this.dialogVisible = true;
  }

  close(): void {
    this.dialogVisible = false;
    this.selected = null;
  }

  download(fileKey: string, fileName: string): void {
    this.service.downloadFile(fileKey).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Download failed';
        this.notificationService.error(msg);
      }
    });
  }

  statusSeverity(status: StudentSubmissionStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'LATE': return 'danger';
      case 'GRADED': return 'success';
      case 'RETURNED': return 'warn';
      default: return 'secondary';
    }
  }
}
```

Route wiring in `client/src/app/app.routes.ts`:

```ts
{
  path: 'submissions',
  loadComponent: () => import('./features/student/submissions/student-submissions.component')
    .then(m => m.StudentSubmissionsComponent)
}
```

## 3) Guardian Homework Monitor (PrimeNG)

### A) Models
Create `client/src/app/features/guardian/homework/guardian-homework.models.ts`:

```ts
export interface GuardianStudentDto {
  id: string;
  email?: string;
  name?: string;
}

export type GuardianHomeworkStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED';

export interface GuardianHomeworkItemDto {
  homeworkId: string;
  title: string;
  dueDate: string;
  className?: string;
  status: GuardianHomeworkStatus;
  submittedAt?: string;
  grade?: number;
}
```

### B) Service
Create `client/src/app/features/guardian/homework/guardian-homework.service.ts`:

```ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GuardianHomeworkItemDto, GuardianStudentDto } from './guardian-homework.models';

@Injectable({ providedIn: 'root' })
export class GuardianHomeworkService {
  private readonly guardianApi = `${environment.apiBaseUrl}/guardian`;

  constructor(private readonly http: HttpClient) {}

  listStudents(): Observable<GuardianStudentDto[]> {
    return this.http.get<GuardianStudentDto[]>(`${this.guardianApi}/students`);
  }

  listHomework(studentId: string): Observable<GuardianHomeworkItemDto[]> {
    const params = new HttpParams().set('studentId', studentId);
    return this.http.get<GuardianHomeworkItemDto[]>(`${this.guardianApi}/homework`, { params });
  }
}
```

### C) Component
Create `client/src/app/features/guardian/homework/guardian-homework.component.ts`:

```ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../shared/services/notification.service';
import { GuardianHomeworkItemDto, GuardianHomeworkStatus, GuardianStudentDto } from './guardian-homework.models';
import { GuardianHomeworkService } from './guardian-homework.service';

@Component({
  selector: 'app-guardian-homework',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, SelectModule, TagModule],
  template: `
    <div class="page">
      <h2>Homework Monitor</h2>

      <div class="picker-row">
        <p-select
          [options]="studentOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select student"
          [showClear]="true"
          [(ngModel)]="selectedStudentId"
          [ngModelOptions]="{ standalone: true }"
          (onChange)="onStudentChanged($event.value)"
        ></p-select>
      </div>

      <p-table [value]="rows" [loading]="loading" [paginator]="true" [rows]="10" sortField="dueDate" [sortOrder]="1">
        <ng-template pTemplate="header">
          <tr>
            <th>Homework</th>
            <th>Class</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Grade</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>{{ row.title }}</td>
            <td>{{ row.className || '-' }}</td>
            <td>{{ row.dueDate }}</td>
            <td><p-tag [severity]="statusSeverity(row.status)" [value]="row.status"></p-tag></td>
            <td>{{ row.submittedAt || '-' }}</td>
            <td>{{ row.grade ?? '-' }}</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; display: grid; gap: 1rem; }
    .picker-row { max-width: 360px; }
    h2 { margin: 0; color: #1976d2; }
  `]
})
export class GuardianHomeworkComponent implements OnInit {
  students: GuardianStudentDto[] = [];
  studentOptions: Array<{ label: string; value: string }> = [];
  selectedStudentId: string | null = null;

  rows: GuardianHomeworkItemDto[] = [];
  loading = false;

  constructor(
    private readonly service: GuardianHomeworkService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading = true;
    this.service.listStudents()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (students) => {
          this.students = students;
          this.studentOptions = students.map(s => ({ label: s.name || s.email || s.id, value: s.id }));
          if (students.length > 0) {
            this.selectedStudentId = students[0].id;
            this.loadHomework(students[0].id);
          }
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to load students';
          this.notificationService.error(msg);
        }
      });
  }

  onStudentChanged(studentId: string | null): void {
    this.selectedStudentId = studentId;
    if (!studentId) {
      this.rows = [];
      return;
    }
    this.loadHomework(studentId);
  }

  loadHomework(studentId: string): void {
    this.loading = true;
    this.service.listHomework(studentId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (rows) => { this.rows = rows; },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to load homework';
          this.notificationService.error(msg);
        }
      });
  }

  statusSeverity(status: GuardianHomeworkStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'LATE': return 'danger';
      case 'GRADED': return 'success';
      case 'NOT_SUBMITTED': return 'warn';
      default: return 'secondary';
    }
  }
}
```

Route wiring in `client/src/app/app.routes.ts`:

```ts
{
  path: 'homework',
  loadComponent: () => import('./features/guardian/homework/guardian-homework.component')
    .then(m => m.GuardianHomeworkComponent)
}
```

## 4) Copilot Prompt Starters

```text
1) Teacher deep-link
Update client/src/app/features/teacher/homework/homework-list.component.ts and client/src/app/features/teacher/submissions/submissions-list.component.ts to support queryParam deep-linking (classId + homeworkId) as defined in docs/PrimeNG-Code-Pack-TeacherDeepLink-StudentSubmissions-GuardianMonitor.md.

2) Student submissions
Create student submissions model/service/component and wire route /student/submissions exactly as defined in docs/PrimeNG-Code-Pack-TeacherDeepLink-StudentSubmissions-GuardianMonitor.md.

3) Guardian monitor
Create guardian homework model/service/component and wire route /guardian/homework exactly as defined in docs/PrimeNG-Code-Pack-TeacherDeepLink-StudentSubmissions-GuardianMonitor.md.
```

## Last Updated
- 2026-05-12

