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
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4">No submissions yet.</td>
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
        next: (rows) => {
          this.rows = rows;
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to load submissions';
          this.notificationService.error(message);
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
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        const message = err?.error?.message || 'Download failed';
        this.notificationService.error(message);
      }
    });
  }

  statusSeverity(status: StudentSubmissionStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'SUBMITTED':
        return 'info';
      case 'LATE':
        return 'danger';
      case 'GRADED':
        return 'success';
      case 'RETURNED':
        return 'warn';
      default:
        return 'secondary';
    }
  }
}

