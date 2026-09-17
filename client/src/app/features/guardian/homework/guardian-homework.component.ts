import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { NotificationService } from '../../../shared/services/notification.service';
import { GuardianHomeworkItemDto, GuardianHomeworkStatus, GuardianStudentDto } from './guardian-homework.models';
import { GuardianHomeworkService } from './guardian-homework.service';

type DuePreset = 'CUSTOM' | 'OVERDUE' | 'TODAY' | 'NEXT_7' | 'NEXT_30';

@Component({
  selector: 'app-guardian-homework',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, SelectModule, TagModule, InputTextModule, ButtonModule, SelectButtonModule],
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

      <div class="preset-row">
        <p-selectButton
          [options]="duePresetOptions"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="selectedDuePreset"
          [ngModelOptions]="{ standalone: true }"
          (onChange)="onDuePresetChange($event.value)"
        ></p-selectButton>

        <button pButton type="button" icon="pi pi-download" label="Export CSV" (click)="exportFilteredCsv()"></button>
      </div>

      <div class="filter-grid">
        <input pInputText type="text" placeholder="Search homework title" [(ngModel)]="searchTitle" [ngModelOptions]="{ standalone: true }" />

        <p-select
          [options]="statusOptions"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="selectedStatus"
          [ngModelOptions]="{ standalone: true }"
          placeholder="Status"
        ></p-select>

        <p-select
          [options]="teacherOptions"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="selectedTeacher"
          [ngModelOptions]="{ standalone: true }"
          placeholder="Teacher"
        ></p-select>

        <input pInputText type="date" [(ngModel)]="dueFrom" [ngModelOptions]="{ standalone: true }" (ngModelChange)="onManualDueDateChange()" />
        <input pInputText type="date" [(ngModel)]="dueTo" [ngModelOptions]="{ standalone: true }" (ngModelChange)="onManualDueDateChange()" />
      </div>

      <div class="filter-actions">
        <button pButton type="button" label="Clear Filters" severity="secondary" [outlined]="true" (click)="clearFilters()"></button>
      </div>

      <p-table [value]="filteredRows" [loading]="loading" [paginator]="true" [rows]="10" sortField="dueDate" [sortOrder]="1">
        <ng-template pTemplate="header">
          <tr>
            <th>Homework</th>
            <th>Class</th>
            <th>Teacher</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Grade</th>
            <th style="width: 110px">Feedback</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>{{ row.title }}</td>
            <td>{{ row.className || row.classId || '-' }}</td>
            <td>{{ row.teacherName || '-' }}</td>
            <td>{{ row.dueDate }}</td>
            <td><p-tag [severity]="statusSeverity(row.status)" [value]="row.status"></p-tag></td>
            <td>{{ row.submittedAt || '-' }}</td>
            <td>{{ row.grade ?? '-' }}</td>
            <td>
              <span *ngIf="isUnreadFeedback(row)" class="pi pi-circle-fill unread-dot" title="Unread feedback"></span>
              <span *ngIf="!isUnreadFeedback(row)">-</span>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8">No homework items found.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; display: grid; gap: 1rem; }
    .picker-row { max-width: 360px; }
    .preset-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(160px, 1fr));
      gap: 0.5rem;
    }
    .filter-actions { display: flex; justify-content: flex-end; }
    .unread-dot { color: #d32f2f; font-size: 0.75rem; }
    h2 { margin: 0; color: #1976d2; }
  `]
})
export class GuardianHomeworkComponent implements OnInit {
  students: GuardianStudentDto[] = [];
  studentOptions: Array<{ label: string; value: string }> = [];
  selectedStudentId: string | null = null;

  rows: GuardianHomeworkItemDto[] = [];
  loading = false;

  searchTitle = '';
  selectedStatus: GuardianHomeworkStatus | 'ALL' = 'ALL';
  selectedTeacher = 'ALL';
  dueFrom = '';
  dueTo = '';
  selectedDuePreset: DuePreset = 'CUSTOM';

  duePresetOptions: Array<{ label: string; value: DuePreset }> = [
    { label: 'Custom', value: 'CUSTOM' },
    { label: 'Overdue', value: 'OVERDUE' },
    { label: 'Today', value: 'TODAY' },
    { label: 'Next 7', value: 'NEXT_7' },
    { label: 'Next 30', value: 'NEXT_30' }
  ];

  teacherOptions: Array<{ label: string; value: string }> = [{ label: 'All Teachers', value: 'ALL' }];
  statusOptions: Array<{ label: string; value: GuardianHomeworkStatus | 'ALL' }> = [
    { label: 'All Status', value: 'ALL' },
    { label: 'Not Submitted', value: 'NOT_SUBMITTED' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Late', value: 'LATE' },
    { label: 'Graded', value: 'GRADED' }
  ];

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
          const message = err?.error?.message || 'Failed to load students';
          this.notificationService.error(message);
        }
      });
  }

  onStudentChanged(studentId: string | null): void {
    this.selectedStudentId = studentId;
    this.clearFilters();
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
        next: (rows) => {
          this.rows = rows;
          const teacherNames = Array.from(new Set(
            rows.map(r => (r.teacherName || '').trim()).filter(Boolean)
          )).sort((a, b) => a.localeCompare(b));

          this.teacherOptions = [
            { label: 'All Teachers', value: 'ALL' },
            ...teacherNames.map(name => ({ label: name, value: name }))
          ];
        },
        error: (err) => {
          const message = err?.error?.message || 'Failed to load homework';
          this.notificationService.error(message);
        }
      });
  }

  get filteredRows(): GuardianHomeworkItemDto[] {
    return this.rows.filter(row => {
      const titleMatch = !this.searchTitle || (row.title || '').toLowerCase().includes(this.searchTitle.toLowerCase());
      const statusMatch = this.selectedStatus === 'ALL' || row.status === this.selectedStatus;
      const teacherMatch = this.selectedTeacher === 'ALL' || (row.teacherName || '') === this.selectedTeacher;
      const due = row.dueDate || '';
      const fromMatch = !this.dueFrom || due >= this.dueFrom;
      const toMatch = !this.dueTo || due <= this.dueTo;
      return titleMatch && statusMatch && teacherMatch && fromMatch && toMatch;
    });
  }

  clearFilters(): void {
    this.searchTitle = '';
    this.selectedStatus = 'ALL';
    this.selectedTeacher = 'ALL';
    this.dueFrom = '';
    this.dueTo = '';
    this.selectedDuePreset = 'CUSTOM';
  }

  onDuePresetChange(preset: DuePreset): void {
    this.selectedDuePreset = preset;

    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (preset === 'CUSTOM') {
      return;
    }
    if (preset === 'OVERDUE') {
      this.dueFrom = '';
      this.dueTo = this.formatDateYmd(this.addDays(dayStart, -1));
      return;
    }
    if (preset === 'TODAY') {
      const ymd = this.formatDateYmd(dayStart);
      this.dueFrom = ymd;
      this.dueTo = ymd;
      return;
    }
    if (preset === 'NEXT_7') {
      this.dueFrom = this.formatDateYmd(dayStart);
      this.dueTo = this.formatDateYmd(this.addDays(dayStart, 7));
      return;
    }

    this.dueFrom = this.formatDateYmd(dayStart);
    this.dueTo = this.formatDateYmd(this.addDays(dayStart, 30));
  }

  onManualDueDateChange(): void {
    this.selectedDuePreset = 'CUSTOM';
  }

  isUnreadFeedback(row: GuardianHomeworkItemDto): boolean {
    if (typeof row.unreadFeedback === 'boolean') {
      return row.unreadFeedback;
    }

    if (row.feedbackUpdatedAt) {
      if (!row.feedbackReadAt) {
        return true;
      }
      return new Date(row.feedbackReadAt).getTime() < new Date(row.feedbackUpdatedAt).getTime();
    }

    return false;
  }

  exportFilteredCsv(): void {
    const rows = this.filteredRows;
    if (!rows.length) {
      this.notificationService.info('No rows to export');
      return;
    }

    const esc = (v: unknown): string => {
      const s = (v ?? '').toString().replace(/"/g, '""');
      return `"${s}"`;
    };

    const header = ['Title', 'Class', 'Teacher', 'DueDate', 'Status', 'SubmittedAt', 'Grade', 'UnreadFeedback'];
    const lines = [header.join(',')];

    for (const r of rows) {
      lines.push([
        esc(r.title),
        esc(r.className || r.classId || ''),
        esc(r.teacherName || ''),
        esc(r.dueDate || ''),
        esc(r.status || ''),
        esc(r.submittedAt || ''),
        esc(r.grade ?? ''),
        esc(this.isUnreadFeedback(r) ? 'YES' : 'NO')
      ].join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'guardian_homework_filtered.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private formatDateYmd(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private addDays(d: Date, n: number): Date {
    const out = new Date(d);
    out.setDate(out.getDate() + n);
    return out;
  }

  statusSeverity(status: GuardianHomeworkStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'SUBMITTED':
        return 'info';
      case 'LATE':
        return 'danger';
      case 'GRADED':
        return 'success';
      case 'NOT_SUBMITTED':
        return 'warn';
      default:
        return 'secondary';
    }
  }
}

