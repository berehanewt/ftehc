import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../shared/services/notification.service';
import { TeacherHomeworkService } from '../homework/teacher-homework.service';
import { TeacherClassDto, TeacherHomeworkDto } from '../homework/teacher-homework.models';
import {
  SubmissionStatus,
  TeacherSubmissionDto,
  UpdateTeacherSubmissionRequest
} from './teacher-submissions.models';
import { TeacherSubmissionsService } from './teacher-submissions.service';

@Component({
  selector: 'app-teacher-submissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    TagModule,
    InputNumberModule
  ],
  template: `
    <div class="page">
      <div class="header-row">
        <h2>Submissions</h2>
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

        <p-select
          [options]="homeworkOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select homework"
          [disabled]="!selectedClassId"
          [showClear]="true"
          [(ngModel)]="selectedHomeworkId"
          [ngModelOptions]="{ standalone: true }"
          (onChange)="onHomeworkChanged($event.value)"
        ></p-select>
      </div>

      <div class="filter-row-extended">
        <input pInputText type="text" placeholder="Search student" [(ngModel)]="studentSearch" [ngModelOptions]="{ standalone: true }" />

        <p-select
          [options]="submissionStatusOptions"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="selectedSubmissionStatus"
          [ngModelOptions]="{ standalone: true }"
          placeholder="Status"
        ></p-select>

        <input pInputText type="date" [(ngModel)]="submittedFrom" [ngModelOptions]="{ standalone: true }" />
        <input pInputText type="date" [(ngModel)]="submittedTo" [ngModelOptions]="{ standalone: true }" />

        <button pButton type="button" label="Clear Filters" severity="secondary" [outlined]="true" (click)="clearSubmissionFilters()"></button>
      </div>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <p-table [value]="filteredSubmissions" [loading]="loading" [paginator]="true" [rows]="10" sortField="submittedAt" [sortOrder]="-1">
        <ng-template pTemplate="header">
          <tr>
            <th>Student</th>
            <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
            <th pSortableColumn="submittedAt">Submitted At <p-sortIcon field="submittedAt"></p-sortIcon></th>
            <th style="width: 130px">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>{{ row.studentEmail || row.studentId }}</td>
            <td><p-tag [severity]="statusSeverity(row.status)" [value]="row.status"></p-tag></td>
            <td>{{ row.submittedAt || '-' }}</td>
            <td>
              <button
                pButton
                type="button"
                label="Review"
                icon="pi pi-eye"
                size="small"
                [outlined]="true"
                [loading]="isOpening(row.id)"
                [disabled]="loading || isOpening(row.id)"
                (click)="openReview(row.id)"
              ></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4">{{ selectedHomeworkId ? 'No submissions found for selected homework.' : 'Select class and homework to view submissions.' }}</td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog
        [(visible)]="reviewVisible"
        [modal]="true"
        [draggable]="false"
        [closable]="!loading"
        [style]="{ width: '44rem' }"
        header="Submission Review"
        (onHide)="closeReview()"
      >
        <ng-container *ngIf="selectedSubmission as sub">
          <div class="review-header">
            <div>
              <div class="student">{{ sub.studentEmail || sub.studentId }}</div>
              <div class="muted">Submitted: {{ sub.submittedAt || '-' }}</div>
            </div>
            <p-tag [severity]="statusSeverity(sub.status)" [value]="sub.status"></p-tag>
          </div>

          <label class="section-title">Submission Text</label>
          <div class="submission-text">{{ sub.text || '-' }}</div>

          <div class="files" *ngIf="sub.files?.length">
            <label class="section-title">Files</label>
            <div class="file-row" *ngFor="let file of sub.files">
              <span>{{ file.fileName }}</span>
              <button pButton type="button" icon="pi pi-download" label="Download" size="small" [outlined]="true" (click)="download(file.fileKey, file.fileName)"></button>
            </div>
          </div>

          <form [formGroup]="reviewForm" class="review-form">
            <label for="status">Status</label>
            <p-select
              inputId="status"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              formControlName="status"
            ></p-select>

            <label for="grade">Grade (0-100)</label>
            <p-inputNumber inputId="grade" mode="decimal" [min]="0" [max]="100" formControlName="grade"></p-inputNumber>

            <label for="feedback">Feedback</label>
            <textarea id="feedback" rows="4" formControlName="feedback" placeholder="Feedback for student"></textarea>
          </form>
        </ng-container>

        <ng-template pTemplate="footer">
          <button pButton type="button" label="Close" severity="secondary" [outlined]="true" [disabled]="loading" (click)="closeReview()"></button>
          <button pButton type="button" label="Save Review" [loading]="loading" [disabled]="reviewForm.invalid || !selectedSubmission" (click)="saveReview()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; display: grid; gap: 1rem; }
    .header-row { display: flex; align-items: center; justify-content: space-between; }
    .filter-row { display: grid; grid-template-columns: repeat(2, minmax(220px, 320px)); gap: 0.6rem; }
    .filter-row-extended { display: grid; grid-template-columns: repeat(5, minmax(170px, 1fr)); gap: 0.6rem; }
    .review-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem; }
    .student { font-weight: 600; }
    .muted { color: #6b7280; font-size: 0.9rem; }
    .section-title { display: block; margin-bottom: 0.4rem; font-weight: 600; }
    .submission-text { background: #f7f8fa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.7rem; margin-bottom: 0.8rem; white-space: pre-wrap; }
    .files { margin-bottom: 0.8rem; }
    .file-row { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; }
    .review-form { display: grid; gap: 0.45rem; }
    .review-form label { font-weight: 600; font-size: 0.9rem; margin-top: 0.25rem; }
    .message.error { color: #c62828; margin: 0; }
    h2 { margin: 0; color: #1976d2; }
  `]
})
export class TeacherSubmissionsComponent implements OnInit {
  classes: TeacherClassDto[] = [];
  homeworkRows: TeacherHomeworkDto[] = [];
  submissionRows: TeacherSubmissionDto[] = [];

  classOptions: Array<{ label: string; value: string }> = [];
  homeworkOptions: Array<{ label: string; value: string }> = [];

  selectedClassId: string | null = null;
  selectedHomeworkId: string | null = null;

  selectedSubmission: TeacherSubmissionDto | null = null;
  reviewVisible = false;

  loading = false;
  errorMessage = '';
  openingSubmissionId: string | null = null;
  private deepLinkedClassId: string | null = null;
  private deepLinkedHomeworkId: string | null = null;

  studentSearch = '';
  submittedFrom = '';
  submittedTo = '';
  selectedSubmissionStatus: SubmissionStatus | 'ALL' = 'ALL';

  readonly statusOptions: Array<{ label: string; value: SubmissionStatus }> = [
    { label: 'SUBMITTED', value: 'SUBMITTED' },
    { label: 'LATE', value: 'LATE' },
    { label: 'GRADED', value: 'GRADED' },
    { label: 'RETURNED', value: 'RETURNED' }
  ];

  readonly submissionStatusOptions: Array<{ label: string; value: SubmissionStatus | 'ALL' }> = [
    { label: 'All Status', value: 'ALL' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Late', value: 'LATE' },
    { label: 'Graded', value: 'GRADED' },
    { label: 'Returned', value: 'RETURNED' }
  ];

  reviewForm: FormGroup<{
    status: FormControl<SubmissionStatus>;
    grade: FormControl<number | null>;
    feedback: FormControl<string>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly teacherHomeworkService: TeacherHomeworkService,
    private readonly teacherSubmissionsService: TeacherSubmissionsService,
    private readonly notificationService: NotificationService,
    private readonly route: ActivatedRoute
  ) {
    this.reviewForm = this.fb.group({
      status: this.fb.nonNullable.control<SubmissionStatus>('GRADED', Validators.required),
      grade: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(100)]),
      feedback: this.fb.nonNullable.control('')
    });
  }

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    this.deepLinkedClassId = queryParams.get('classId');
    this.deepLinkedHomeworkId = queryParams.get('homeworkId');
    if (this.deepLinkedClassId) {
      this.selectedClassId = this.deepLinkedClassId;
    }

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
            this.loadHomeworkForClass(this.selectedClassId);
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
    this.selectedHomeworkId = null;
    this.submissionRows = [];

    if (!classId) {
      this.homeworkRows = [];
      this.homeworkOptions = [];
      return;
    }

    this.loadHomeworkForClass(classId);
  }

  private loadHomeworkForClass(classId: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.teacherHomeworkService.listHomework(classId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (rows) => {
          this.homeworkRows = rows;
          this.homeworkOptions = rows.map(h => ({ label: `${h.title} (Due: ${h.dueDate})`, value: h.id }));

          const preferredHomeworkId = this.deepLinkedHomeworkId;
          const preferredHomework = preferredHomeworkId
            ? rows.find(h => h.id === preferredHomeworkId)
            : null;

          if (preferredHomework) {
            this.selectedHomeworkId = preferredHomework.id;
            this.deepLinkedHomeworkId = null;
            this.loadSubmissions(preferredHomework.id);
          } else if (rows.length > 0) {
            this.selectedHomeworkId = rows[0].id;
            this.loadSubmissions(rows[0].id);
          } else {
            this.selectedHomeworkId = null;
          }
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load homework list';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  onHomeworkChanged(homeworkId: string | null): void {
    this.selectedHomeworkId = homeworkId;
    if (!homeworkId) {
      this.submissionRows = [];
      return;
    }
    this.loadSubmissions(homeworkId);
  }

  loadSubmissions(homeworkId: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.teacherSubmissionsService.listSubmissions(homeworkId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (rows) => {
          this.submissionRows = rows;
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load submissions';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  openReview(submissionId: string): void {
    const target = this.submissionRows.find(s => s.id === submissionId);
    if (!target) {
      return;
    }

    this.openingSubmissionId = submissionId;
    this.selectedSubmission = target;
    this.reviewForm.reset({
      status: target.status,
      grade: target.grade ?? null,
      feedback: target.feedback ?? ''
    });
    this.reviewVisible = true;
    this.openingSubmissionId = null;
  }

  isOpening(submissionId: string): boolean {
    return this.openingSubmissionId === submissionId;
  }

  saveReview(): void {
    if (!this.selectedSubmission || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const raw = this.reviewForm.getRawValue();
    const payload: UpdateTeacherSubmissionRequest = {
      status: raw.status,
      grade: raw.grade ?? undefined,
      feedback: raw.feedback.trim() || undefined
    };

    this.loading = true;
    this.errorMessage = '';

    this.teacherSubmissionsService.updateSubmission(this.selectedSubmission.id, payload)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (updated) => {
          this.submissionRows = this.submissionRows.map(row => row.id === updated.id ? updated : row);
          this.selectedSubmission = updated;
          this.notificationService.success('Submission review saved');
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to save review';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  download(fileKey: string, fileName: string): void {
    this.teacherSubmissionsService.downloadFile(fileKey)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = fileName;
          anchor.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to download file';
          this.notificationService.error(message);
        }
      });
  }

  closeReview(): void {
    this.reviewVisible = false;
    this.selectedSubmission = null;
  }

  statusSeverity(status: SubmissionStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'LATE': return 'danger';
      case 'GRADED': return 'success';
      case 'RETURNED': return 'warn';
      default: return 'secondary';
    }
  }

  get filteredSubmissions(): TeacherSubmissionDto[] {
    return this.submissionRows.filter(row => {
      const studentLabel = (row.studentEmail || row.studentId || '').toLowerCase();
      const studentMatch = !this.studentSearch || studentLabel.includes(this.studentSearch.toLowerCase());
      const statusMatch = this.selectedSubmissionStatus === 'ALL' || row.status === this.selectedSubmissionStatus;
      const submittedDate = row.submittedAt ? row.submittedAt.slice(0, 10) : '';
      const fromMatch = !this.submittedFrom || (submittedDate && submittedDate >= this.submittedFrom);
      const toMatch = !this.submittedTo || (submittedDate && submittedDate <= this.submittedTo);
      return studentMatch && statusMatch && fromMatch && toMatch;
    });
  }

  clearSubmissionFilters(): void {
    this.studentSearch = '';
    this.selectedSubmissionStatus = 'ALL';
    this.submittedFrom = '';
    this.submittedTo = '';
  }
}

// Backward-compatible export for existing route imports.
export { TeacherSubmissionsComponent as SubmissionsListComponent };
