# Enhancement Pack — Guardian View: Student Name + Status Filter + Class Filter (PrimeNG)

This pack updates the **Guardian Homework Monitor** page to add:

1) **Student name header** (shows selected student name/email)
2) **Status filter** (dropdown)
3) **Class filter** (dropdown)

Target: Angular (standalone) + PrimeNG + PrimeFlex. Save under `docs/` and keep open in IntelliJ for Copilot context.

## Assumptions

- You already have `GuardianHomeworkComponent` and services created (from earlier guide).
- Backend returns `className` and `teacherName` in each homework item (optional but recommended).
- Backend guardian students endpoint returns `name` and/or `email`.


## 1) Models

```ts
// src/app/features/guardian/models/guardian.models.ts
export interface GuardianStudentDto {
  id: string;
  email?: string;
  name?: string;
}

export type HomeworkStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED';

export interface GuardianHomeworkItemDto {
  homeworkId: string;
  title: string;
  dueDate: string;

  classId?: string;
  className?: string;
  teacherName?: string;

  status: HomeworkStatus;
  submittedAt?: string;
  grade?: number;
}
```


## 2) GuardianHomeworkComponent — TypeScript (add header + filters + computed list)

```ts
// src/app/features/guardian/pages/homework/guardian-homework.component.ts
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';

import { MessageService } from 'primeng/api';

import { GuardianStudentsService } from '../../services/guardian-students.service';
import { GuardianHomeworkService } from '../../services/guardian-homework.service';
import { GuardianHomeworkItemDto, GuardianStudentDto, HomeworkStatus } from '../../models/guardian.models';

type StatusFilter = HomeworkStatus | 'ALL';

type ClassFilter = { label: string; value: string | 'ALL' };

type StatusOption = { label: string; value: StatusFilter };

@Component({
  selector: 'app-guardian-homework',
  standalone: true,
  imports: [CommonModule, DropdownModule, TableModule, ToastModule, TagModule],
  providers: [MessageService],
  templateUrl: './guardian-homework.component.html',
})
export class GuardianHomeworkComponent {
  private studentsSvc = inject(GuardianStudentsService);
  private hwSvc = inject(GuardianHomeworkService);
  private msg = inject(MessageService);

  loading = signal(false);

  students = signal<GuardianStudentDto[]>([]);
  selectedStudentId = signal<string | null>(null);

  // Header: selected student display name
  selectedStudent = computed(() => {
    const id = this.selectedStudentId();
    return this.students().find(s => s.id === id) ?? null;
  });

  studentDisplay = computed(() => {
    const s = this.selectedStudent();
    if (!s) return '';
    return s.name || s.email || s.id;
  });

  // Homework items
  items = signal<GuardianHomeworkItemDto[]>([]);

  // Filters
  statusFilter = signal<StatusFilter>('ALL');
  classFilter = signal<string | 'ALL'>('ALL');

  statusOptions: StatusOption[] = [
    { label: 'All Status', value: 'ALL' },
    { label: 'Not Submitted', value: 'NOT_SUBMITTED' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Late', value: 'LATE' },
    { label: 'Graded', value: 'GRADED' },
  ];

  classOptions = signal<ClassFilter[]>([{ label: 'All Classes', value: 'ALL' }]);

  // Filtered list (reactive)
  filteredItems = computed(() => {
    const status = this.statusFilter();
    const cls = this.classFilter();
    let list = this.items();

    if (status !== 'ALL') {
      list = list.filter(x => x.status === status);
    }

    if (cls !== 'ALL') {
      list = list.filter(x => (x.classId || x.className || '') === cls);
    }

    return list;
  });

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.loading.set(true);
    this.studentsSvc.listLinkedStudents().subscribe({
      next: (data) => {
        this.students.set(data);
        this.loading.set(false);

        if (data.length && !this.selectedStudentId()) {
          this.selectedStudentId.set(data[0].id);
          this.loadHomework();
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toastError(err, 'Failed to load students');
      }
    });
  }

  onStudentChange() {
    // reset filters on student switch
    this.statusFilter.set('ALL');
    this.classFilter.set('ALL');
    this.classOptions.set([{ label: 'All Classes', value: 'ALL' }]);

    this.loadHomework();
  }

  loadHomework() {
    const studentId = this.selectedStudentId();
    this.items.set([]);
    if (!studentId) return;

    this.loading.set(true);
    this.hwSvc.listHomework(studentId).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
        this.buildClassOptions(data);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastError(err, 'Failed to load homework');
      }
    });
  }

  buildClassOptions(data: GuardianHomeworkItemDto[]) {
    // We support filtering by className if present, otherwise classId
    const seen = new Map<string, string>(); // value -> label

    for (const item of data) {
      const value = (item.classId || item.className || '').trim();
      if (!value) continue;

      const label = (item.className || item.classId || value).trim();
      if (!seen.has(value)) {
        seen.set(value, label);
      }
    }

    const options: ClassFilter[] = [{ label: 'All Classes', value: 'ALL' }];
    Array.from(seen.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([value, label]) => options.push({ value, label }));

    this.classOptions.set(options);
  }

  statusSeverity(s: HomeworkStatus): 'success'|'warning'|'danger'|'info'|'secondary' {
    switch (s) {
      case 'SUBMITTED': return 'info';
      case 'LATE': return 'danger';
      case 'GRADED': return 'success';
      case 'NOT_SUBMITTED': return 'warning';
      default: return 'secondary';
    }
  }

  private toastError(err: any, fallback: string) {
    const msg = err?.error?.message || err?.message || fallback;
    this.msg.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}
```


## 3) GuardianHomeworkComponent — HTML (header + filters + filtered table)

```html
<!-- src/app/features/guardian/pages/homework/guardian-homework.component.html -->
<p-toast></p-toast>

<div class="mb-3">
  <h2 class="m-0">Homework Monitor</h2>
  <p class="mt-2 text-sm">Track your child's homework status.</p>
</div>

<!-- Student selector + header -->
<div class="grid mb-2">
  <div class="col-12 md:col-6">
    <label class="block mb-2 font-medium">Student</label>
    <p-dropdown class="w-full"
      [options]="students()"
      optionValue="id"
      [ngModel]="selectedStudentId()"
      (ngModelChange)="selectedStudentId.set($event); onStudentChange()"
      placeholder="Select student">

      <ng-template pTemplate="item" let-s>
        <div class="font-medium">{{ s.name || s.email || s.id }}</div>
      </ng-template>

      <ng-template pTemplate="selectedItem" let-s>
        <div class="font-medium">{{ s?.name || s?.email || s?.id }}</div>
      </ng-template>
    </p-dropdown>
  </div>

  <div class="col-12 md:col-6 flex align-items-end">
    <div class="p-3 surface-100 border-round w-full">
      <div class="text-sm text-500">Selected student</div>
      <div class="text-xl font-semibold">{{ studentDisplay() || '-' }}</div>
    </div>
  </div>
</div>

<!-- Filters row -->
<div class="grid mb-3">
  <div class="col-12 md:col-3">
    <label class="block mb-2 font-medium">Status</label>
    <p-dropdown class="w-full"
      [options]="statusOptions"
      optionLabel="label"
      optionValue="value"
      [ngModel]="statusFilter()"
      (ngModelChange)="statusFilter.set($event)"
      placeholder="All Status">
    </p-dropdown>
  </div>

  <div class="col-12 md:col-4">
    <label class="block mb-2 font-medium">Class</label>
    <p-dropdown class="w-full"
      [options]="classOptions()"
      optionLabel="label"
      optionValue="value"
      [ngModel]="classFilter()"
      (ngModelChange)="classFilter.set($event)"
      placeholder="All Classes">
    </p-dropdown>
  </div>

  <div class="col-12 md:col-5 flex align-items-end justify-content-end">
    <button pButton type="button" class="p-button-text" icon="pi pi-refresh" label="Refresh" (click)="loadHomework()"></button>
  </div>
</div>

<!-- Table (filteredItems) -->
<p-table [value]="filteredItems()" [loading]="loading()" [paginator]="true" [rows]="10" responsiveLayout="scroll">
  <ng-template pTemplate="header">
    <tr>
      <th>Homework</th>
      <th>Class</th>
      <th>Teacher</th>
      <th>Due Date</th>
      <th>Status</th>
      <th>Submitted</th>
      <th>Grade</th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-h>
    <tr>
      <td class="font-medium">{{ h.title }}</td>
      <td>{{ h.className || h.classId || '-' }}</td>
      <td>{{ h.teacherName || '-' }}</td>
      <td>{{ h.dueDate }}</td>
      <td><p-tag [severity]="statusSeverity(h.status)" [value]="h.status"></p-tag></td>
      <td>{{ h.submittedAt || '-' }}</td>
      <td>{{ (h.grade === 0 || h.grade) ? h.grade : '-' }}</td>
    </tr>
  </ng-template>

  <ng-template pTemplate="emptymessage">
    <tr><td colspan="7" class="text-center p-4">No homework items match your filters</td></tr>
  </ng-template>
</p-table>
```


## 4) Copilot prompts (copy/paste)

```text
PROMPT 1 — Add student header
Update GuardianHomeworkComponent to display the selected student's name/email in a header card next to the student dropdown.

PROMPT 2 — Add filters
Add status filter dropdown (ALL/NOT_SUBMITTED/SUBMITTED/LATE/GRADED) and class filter dropdown (ALL + dynamic class list from loaded items). Use a computed filteredItems list feeding the PrimeNG table.

PROMPT 3 — Apply changes exactly
Apply the changes exactly as defined in docs/Enhancement-Pack-Guardian-StudentName-StatusClassFilters.md (TypeScript + HTML + model update).
```
