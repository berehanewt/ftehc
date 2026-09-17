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

type AdminClassRow = AdminClass & { teacherEmail: string };

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
          <span class="search-wrap">
            <i class="pi pi-search"></i>
            <input
              #globalSearchInput
              pInputText
              type="text"
              placeholder="Search classes"
              [(ngModel)]="globalSearchText"
              [ngModelOptions]="{ standalone: true }"
              (input)="onTableSearch(dt, $event)"
            />
          </span>
          <button
            pButton
            type="button"
            label="Clear Filters"
            icon="pi pi-filter-slash"
            severity="secondary"
            [outlined]="true"
            (click)="clearAllFilters(dt, globalSearchInput, nameFilterInput, gradeFilterInput)"
          ></button>
          <button pButton type="button" label="Create Class" icon="pi pi-plus" (click)="openCreateDialog()"></button>
        </div>
      </div>

      <div class="filter-row">
        <input
          #nameFilterInput
          pInputText
          type="text"
          placeholder="Filter by name"
          [(ngModel)]="nameFilterText"
          [ngModelOptions]="{ standalone: true }"
          (input)="onColumnFilter(dt, 'name', $event)"
        />
        <input
          #gradeFilterInput
          pInputText
          type="text"
          placeholder="Filter by grade"
          [(ngModel)]="gradeFilterText"
          [ngModelOptions]="{ standalone: true }"
          (input)="onColumnFilter(dt, 'grade', $event)"
        />
        <p-select
          [options]="teacherFilterOptions"
          placeholder="Filter by teacher"
          [showClear]="true"
          [(ngModel)]="selectedTeacherFilter"
          [ngModelOptions]="{ standalone: true }"
          (onChange)="onTeacherFilterChange(dt, $event.value)"
        ></p-select>
      </div>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <p-table
        #dt
        [value]="classRows"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="rowsPerPageOptions"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} classes"
        [loading]="loading"
        responsiveLayout="scroll"
        dataKey="id"
        [globalFilterFields]="['name', 'grade', 'teacherEmail']"
        sortField="name"
        [sortOrder]="1"
        stateStorage="session"
        stateKey="admin-classes-table-state"
      >
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
            <th pSortableColumn="grade">Grade <p-sortIcon field="grade"></p-sortIcon></th>
            <th pSortableColumn="teacherEmail">Teacher <p-sortIcon field="teacherEmail"></p-sortIcon></th>
            <th>Students</th>
            <th style="width: 260px">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-schoolClass>
          <tr>
            <td>{{ schoolClass.name }}</td>
            <td>{{ schoolClass.grade || '-' }}</td>
            <td>{{ teacherLabel(schoolClass) }}</td>
            <td>{{ schoolClass.studentIds?.length || 0 }}</td>
            <td class="actions-cell">
              <button
                pButton
                type="button"
                label="Edit"
                severity="secondary"
                size="small"
                [disabled]="isRowBusy(schoolClass.id)"
                (click)="openEditDialog(schoolClass)"
              ></button>
              <button
                pButton
                type="button"
                label="Assign Teacher"
                size="small"
                [disabled]="isRowBusy(schoolClass.id)"
                (click)="openAssignTeacherDialog(schoolClass)"
              ></button>
              <button
                pButton
                type="button"
                label="Delete"
                severity="danger"
                size="small"
                [outlined]="true"
                [loading]="isDeletingRow(schoolClass.id)"
                [disabled]="isRowBusy(schoolClass.id)"
                (click)="deleteClass(schoolClass.id)"
              ></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5">No classes found.</td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog
        [(visible)]="dialogVisible"
        [modal]="true"
        [closable]="!loading"
        [draggable]="false"
        [style]="{ width: '34rem' }"
        [header]="teacherOnlyMode ? 'Assign Teacher' : (editingId ? 'Edit Class' : 'Create Class')"
        (onHide)="closeDialog()"
      >
        <form [formGroup]="classForm" (ngSubmit)="saveClass()" class="dialog-form">
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

          <small class="field-error" *ngIf="classForm.controls.name.touched && classForm.controls.name.invalid">
            Class name is required.
          </small>
        </form>

        <ng-template pTemplate="footer">
          <button pButton type="button" label="Cancel" severity="secondary" [outlined]="true" [disabled]="loading" (click)="closeDialog()"></button>
          <button pButton type="button" [label]="editingId ? 'Save Changes' : 'Create Class'" [loading]="loading" [disabled]="classForm.invalid" (click)="saveClass()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; display: grid; gap: 1rem; }
    .header-row { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
    .header-actions { display: flex; align-items: center; gap: 0.6rem; }
    .search-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      padding: 0.25rem 0.55rem;
      background: #fff;
    }
    .search-wrap input { border: none; outline: none; min-width: 13rem; }
    .search-wrap i { color: #6b7280; }
    .filter-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(140px, 220px));
      gap: 0.55rem;
    }
    h2 { color: #1976d2; margin: 0; }
    .actions-cell { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .dialog-form { display: grid; gap: 0.45rem; }
    .dialog-form label { font-weight: 600; font-size: 0.9rem; margin-top: 0.35rem; }
    .field-error { color: #c62828; }
    .message.error { color: #c62828; margin: 0; }
  `]
})
export class AdminClassesComponent implements OnInit {
  classes: AdminClass[] = [];
  classRows: AdminClassRow[] = [];
  teachers: AdminUser[] = [];
  teacherOptions: Array<{ label: string; value: string }> = [];
  teacherFilterOptions: Array<{ label: string; value: string }> = [];
  globalSearchText = '';
  nameFilterText = '';
  gradeFilterText = '';
  selectedTeacherFilter: string | null = null;
  rowsPerPageOptions: number[] = [10, 25, 50];

  loading = false;
  errorMessage = '';

  dialogVisible = false;
  teacherOnlyMode = false;
  editingId: string | null = null;
  activeRowId: string | null = null;

  classForm: FormGroup<{
    name: FormControl<string>;
    grade: FormControl<string>;
    teacherId: FormControl<string | null>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly classesAdminService: ClassesAdminService,
    private readonly usersAdminService: UsersAdminService,
    private readonly notificationService: NotificationService
  ) {
    this.classForm = this.fb.group({
      name: this.fb.nonNullable.control('', Validators.required),
      grade: this.fb.nonNullable.control(''),
      teacherId: this.fb.control<string | null>(null)
    });
  }

  ngOnInit(): void {
    this.restoreFilterInputsFromState();
    this.loadTeachers();
    this.loadClasses();
  }

  loadClasses(): void {
    this.loading = true;
    this.errorMessage = '';

    this.classesAdminService.listClasses()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (classes) => {
          this.classes = classes;
          this.rebuildClassRows();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load classes';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  onTableSearch(table: { filterGlobal: (value: string, matchMode: string) => void }, event: Event): void {
    const value = (event.target as HTMLInputElement).value || '';
    table.filterGlobal(value, 'contains');
  }

  onColumnFilter(
    table: { filter: (value: string, field: string, matchMode: string) => void },
    field: 'name' | 'grade' | 'teacherEmail',
    event: Event
  ): void {
    const value = (event.target as HTMLInputElement).value || '';
    table.filter(value, field, 'contains');
  }

  onTeacherFilterChange(
    table: { filter: (value: string | null, field: string, matchMode: string) => void },
    teacherEmail: string | null
  ): void {
    table.filter(teacherEmail, 'teacherEmail', 'equals');
  }

  clearAllFilters(
    table: { clear: () => void },
    globalInput: HTMLInputElement,
    nameInput: HTMLInputElement,
    gradeInput: HTMLInputElement
  ): void {
    table.clear();
    globalInput.value = '';
    nameInput.value = '';
    gradeInput.value = '';
    this.globalSearchText = '';
    this.nameFilterText = '';
    this.gradeFilterText = '';
    this.selectedTeacherFilter = null;
  }

  private restoreFilterInputsFromState(): void {
    try {
      const stateJson = sessionStorage.getItem('admin-classes-table-state');
      if (!stateJson) {
        return;
      }

      const state = JSON.parse(stateJson) as {
        filters?: Record<string, { value?: unknown }>;
      };

      const filters = state.filters ?? {};
      this.globalSearchText = this.asString(filters['global']?.value);
      this.nameFilterText = this.asString(filters['name']?.value);
      this.gradeFilterText = this.asString(filters['grade']?.value);
      this.selectedTeacherFilter = this.asNullableString(filters['teacherEmail']?.value);
    } catch {
      // Ignore corrupted table state and keep defaults.
    }
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private asNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  loadTeachers(): void {
    this.usersAdminService.listUsers().subscribe({
      next: (users) => {
        this.teachers = users.filter(user => user.roles.includes('TEACHER'));
        this.teacherOptions = this.teachers.map(user => ({
          label: user.email,
          value: user.id
        }));
        this.teacherFilterOptions = this.teachers.map(user => ({
          label: user.email,
          value: user.email
        }));
        this.rebuildClassRows();
      },
      error: () => {
        this.notificationService.warning('Could not load teacher list. You can still create classes.');
      }
    });
  }

  openCreateDialog(): void {
    this.editingId = null;
    this.teacherOnlyMode = false;
    this.classForm.reset({ name: '', grade: '', teacherId: null });
    this.dialogVisible = true;
  }

  openEditDialog(schoolClass: AdminClass): void {
    this.editingId = schoolClass.id;
    this.teacherOnlyMode = false;
    this.classForm.patchValue({
      name: schoolClass.name,
      grade: schoolClass.grade || '',
      teacherId: schoolClass.teacherId || null
    });
    this.dialogVisible = true;
  }

  openAssignTeacherDialog(schoolClass: AdminClass): void {
    this.editingId = schoolClass.id;
    this.teacherOnlyMode = true;
    this.classForm.patchValue({
      name: schoolClass.name,
      grade: schoolClass.grade || '',
      teacherId: schoolClass.teacherId || null
    });
    this.dialogVisible = true;
  }

  teacherLabel(schoolClass: AdminClassRow): string {
    if (schoolClass.teacherEmail) {
      return schoolClass.teacherEmail;
    }

    if (!schoolClass.teacherId) {
      return '-';
    }

    return schoolClass.teacherId;
  }

  saveClass(): void {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    const payload = this.toPayload();

    this.loading = true;
    this.errorMessage = '';

    const request$ = this.editingId
      ? this.classesAdminService.updateClass(this.editingId, payload)
      : this.classesAdminService.createClass(payload);

    request$
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: () => {
          this.notificationService.success(this.editingId ? 'Class updated successfully' : 'Class created successfully');
          this.closeDialog();
          this.loadClasses();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to save class';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.teacherOnlyMode = false;
    this.editingId = null;
    this.classForm.reset({ name: '', grade: '', teacherId: null });
  }

  deleteClass(id: string): void {
    if (!confirm('Delete this class?')) {
      return;
    }

    this.loading = true;
    this.activeRowId = id;
    this.errorMessage = '';

    this.classesAdminService.deleteClass(id)
      .pipe(finalize(() => {
        this.loading = false;
        this.activeRowId = null;
      }))
      .subscribe({
        next: () => {
          this.classes = this.classes.filter(c => c.id !== id);
          this.rebuildClassRows();
          this.notificationService.success('Class deleted successfully');
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to delete class';
          this.notificationService.error(this.errorMessage);
        }
      });
  }

  isDeletingRow(id: string): boolean {
    return this.loading && this.activeRowId === id;
  }

  isRowBusy(id: string): boolean {
    return this.loading && this.activeRowId === id;
  }

  private rebuildClassRows(): void {
    const teacherById = new Map(this.teachers.map(teacher => [teacher.id, teacher.email]));
    this.classRows = this.classes.map(schoolClass => ({
      ...schoolClass,
      teacherEmail: schoolClass.teacherId ? (teacherById.get(schoolClass.teacherId) || '') : ''
    }));
  }

  private toPayload(): UpsertAdminClassRequest {
    const raw = this.classForm.getRawValue();
    const name = (raw.name || '').trim();
    const grade = (raw.grade || '').trim();
    const teacherId = raw.teacherId || undefined;

    return {
      name,
      ...(grade ? { grade } : {}),
      ...(teacherId ? { teacherId } : {})
    };
  }
}

// Backward-compatible export for existing route imports.
export { AdminClassesComponent as ClassesListComponent };
