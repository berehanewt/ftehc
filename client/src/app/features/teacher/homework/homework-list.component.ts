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
import { Router } from '@angular/router';
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
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
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
            <th style="width: 270px">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>{{ row.title }}</td>
            <td><p-tag [severity]="dueSeverity(row.dueDate)" [value]="row.dueDate"></p-tag></td>
            <td>{{ row.description || '-' }}</td>
            <td>
              <button
                pButton
                type="button"
                label="Submissions"
                icon="pi pi-inbox"
                severity="secondary"
                size="small"
                [outlined]="true"
                [disabled]="loading"
                (click)="goToSubmissions(row.id)"
              ></button>
              <button
                pButton
                type="button"
                label="Delete"
                severity="danger"
                size="small"
                [outlined]="true"
                [loading]="isDeleting(row.id)"
                [disabled]="loading || isDeleting(row.id)"
                (click)="deleteHomework(row.id)"
              ></button>
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
          <textarea id="description" rows="4" formControlName="description" placeholder="Instructions"></textarea>

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
  deletingHomeworkId: string | null = null;

  homeworkForm: FormGroup<{
    classId: FormControl<string | null>;
    title: FormControl<string>;
    description: FormControl<string>;
    dueDate: FormControl<string | null>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly teacherHomeworkService: TeacherHomeworkService,
    private readonly notificationService: NotificationService,
    private readonly router: Router
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

    this.deletingHomeworkId = homeworkId;
    this.errorMessage = '';

    this.teacherHomeworkService.deleteHomework(homeworkId)
      .pipe(finalize(() => { this.deletingHomeworkId = null; }))
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

  isDeleting(homeworkId: string): boolean {
    return this.deletingHomeworkId === homeworkId;
  }

  goToSubmissions(homeworkId: string): void {
    this.router.navigate(['/teacher/submissions'], {
      queryParams: {
        classId: this.selectedClassId,
        homeworkId
      }
    });
  }

  dueSeverity(dueDate: string): 'success' | 'warn' | 'danger' {
    const today = new Date().toISOString().slice(0, 10);
    if (dueDate < today) return 'danger';
    if (dueDate === today) return 'warn';
    return 'success';
  }
}

// Backward-compatible export for existing route imports.
export { TeacherHomeworkComponent as HomeworkListComponent };

