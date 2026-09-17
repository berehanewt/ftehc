import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuditLogItem, AuditLogsAdminService } from './audit-logs-admin.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, ButtonModule, InputTextModule],
  template: `
    <div class="page">
      <h2>Audit Logs</h2>
      <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="filters">
        <input pInputText type="text" placeholder="User ID" formControlName="userId" />
        <input pInputText type="text" placeholder="Action" formControlName="action" />
        <input pInputText type="datetime-local" formControlName="from" />
        <input pInputText type="datetime-local" formControlName="to" />
        <button pButton type="submit" label="Filter" severity="secondary" [disabled]="loading"></button>
        <button pButton type="button" label="Reset" severity="secondary" [outlined]="true" (click)="resetFilters()" [disabled]="loading"></button>
      </form>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <p-table
        [value]="logs"
        [loading]="loading"
        [paginator]="true"
        [rows]="20"
        [rowsPerPageOptions]="[20, 50, 100]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} logs"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Method</th>
            <th>Path</th>
            <th>IP</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-log>
          <tr>
            <td>{{ formatTime(log.timestamp) }}</td>
            <td>{{ log.userId || '-' }}</td>
            <td>{{ log.action || '-' }}</td>
            <td>{{ log.entity || '-' }}{{ log.entityId ? ' (' + log.entityId + ')' : '' }}</td>
            <td>{{ log.method || '-' }}</td>
            <td>{{ log.path || '-' }}</td>
            <td>{{ log.ip || '-' }}</td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7">No audit logs found for the selected filters.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { color: #1976d2; }
    .filters {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr auto auto;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .message.error { color: #c62828; margin-bottom: 0.7rem; }
  `]
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLogItem[] = [];
  loading = false;
  errorMessage = '';

  filterForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auditLogsService: AuditLogsAdminService,
    private readonly route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      userId: [''],
      action: [''],
      from: [''],
      to: ['']
    });
  }

  ngOnInit(): void {
    const action = this.route.snapshot.queryParamMap.get('action');
    if (action) {
      this.filterForm.patchValue({ action });
    }
    this.applyFilters();
  }

  applyFilters(): void {
    this.loading = true;
    this.errorMessage = '';

    const value = this.filterForm.value;

    this.auditLogsService.queryLogs({
      userId: value.userId || undefined,
      action: value.action || undefined,
      from: value.from ? new Date(value.from).toISOString() : undefined,
      to: value.to ? new Date(value.to).toISOString() : undefined,
      limit: 200
    })
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (logs) => { this.logs = logs; },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load audit logs';
        }
      });
  }

  resetFilters(): void {
    this.filterForm.reset({ userId: '', action: '', from: '', to: '' });
    this.applyFilters();
  }

  formatTime(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }
}
