import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { UserRole } from '../../../core/models/auth.model';
import { AdminUser, CreateAdminUserRequest, UpdateAdminUserRequest, UsersAdminService } from './users-admin.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TableModule, ButtonModule, InputTextModule],
  template: `
    <div class="page">
      <h2>User Management</h2>

      <form [formGroup]="createForm" (ngSubmit)="createUser()" class="form-card">
        <div class="field-group">
          <input pInputText type="email" placeholder="Email" formControlName="email" />
          <small class="field-error" *ngIf="getFieldError('email')">{{ getFieldError('email') }}</small>
        </div>
        <div class="field-group">
          <input pInputText type="password" placeholder="Password" formControlName="password" />
          <small class="field-error" *ngIf="getFieldError('password')">{{ getFieldError('password') }}</small>
        </div>
        <div class="field-group">
          <select formControlName="role">
            <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
          </select>
        </div>
        <div class="field-group" *ngIf="isTeacherSelected()">
          <input
            pInputText
            type="text"
            placeholder="Teacher Name"
            formControlName="name"
          />
          <small class="field-error" *ngIf="getFieldError('name')">{{ getFieldError('name') }}</small>
        </div>
        <div class="field-group" *ngIf="isTeacherSelected()">
          <input
            pInputText
            type="text"
            placeholder="Subject"
            formControlName="subject"
          />
          <small class="field-error" *ngIf="getFieldError('subject')">{{ getFieldError('subject') }}</small>
        </div>
        <div class="field-group" *ngIf="isStudentSelected()">
          <input
            pInputText
            type="text"
            placeholder="Student First Name"
            formControlName="firstName"
          />
          <small class="field-error" *ngIf="getFieldError('firstName')">{{ getFieldError('firstName') }}</small>
        </div>
        <div class="field-group" *ngIf="isStudentSelected()">
          <input
            pInputText
            type="text"
            placeholder="Student Last Name"
            formControlName="lastName"
          />
          <small class="field-error" *ngIf="getFieldError('lastName')">{{ getFieldError('lastName') }}</small>
        </div>
        <div class="field-group" *ngIf="isStudentSelected()">
          <input
            pInputText
            type="text"
            placeholder="Grade"
            formControlName="grade"
          />
          <small class="field-error" *ngIf="getFieldError('grade')">{{ getFieldError('grade') }}</small>
        </div>
        <div class="field-group" *ngIf="isGuardianSelected()">
          <input
            pInputText
            type="text"
            placeholder="Relationship"
            formControlName="relationship"
          />
          <small class="field-error" *ngIf="getFieldError('relationship')">{{ getFieldError('relationship') }}</small>
        </div>
        <div class="field-group action-group">
          <button pButton type="submit" label="Create User" icon="pi pi-user-plus" [loading]="loading" [disabled]="loading || createForm.invalid"></button>
        </div>
      </form>

      <p class="message info" *ngIf="roleHelperText">{{ roleHelperText }}</p>

      <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <section class="summary-card" *ngIf="auditSummaries.length">
        <div class="summary-header">
          <h3>Audit summary</h3>
          <div class="summary-actions">
            <span>{{ auditSummaries.length }} recent</span>
            <button
              pButton
              type="button"
              size="small"
              label="Open Audit Logs"
              icon="pi pi-history"
              severity="secondary"
              [outlined]="true"
              [routerLink]="['/admin/audit-logs']"
              [queryParams]="auditQueryParams"
              (click)="openAuditLogsShortcut()"
            ></button>
            <button
              pButton
              type="button"
              size="small"
              label="Clear"
              severity="secondary"
              [text]="true"
              [disabled]="!auditActionFilter"
              (click)="clearAuditFilter()"
            ></button>
          </div>
        </div>
        <ul>
          <li *ngFor="let summary of auditSummaries">{{ summary }}</li>
        </ul>
        <p class="message info summary-note" *ngIf="auditActionLabel">
          Audit Logs will open filtered by action: {{ auditActionLabel }}.
        </p>
      </section>

      <section class="edit-card" *ngIf="selectedUser">
        <div class="edit-header">
          <h3>Edit User</h3>
          <button pButton type="button" label="Cancel" severity="secondary" size="small" (click)="cancelEdit()"></button>
        </div>
        <p class="edit-email">Editing <strong>{{ selectedUser.email }}</strong></p>

        <form [formGroup]="editForm" (ngSubmit)="saveUser()" class="form-card">
          <div class="field-group">
            <select formControlName="role">
              <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
            </select>
          </div>
          <div class="field-group">
            <input pInputText type="password" placeholder="New Password (optional)" formControlName="password" />
            <small class="field-error" *ngIf="getEditFieldError('password')">{{ getEditFieldError('password') }}</small>
          </div>
          <div class="field-group" *ngIf="isEditTeacherSelected()">
            <input pInputText type="text" placeholder="Teacher Name" formControlName="name" />
            <small class="field-error" *ngIf="getEditFieldError('name')">{{ getEditFieldError('name') }}</small>
          </div>
          <div class="field-group" *ngIf="isEditTeacherSelected()">
            <input pInputText type="text" placeholder="Subject" formControlName="subject" />
            <small class="field-error" *ngIf="getEditFieldError('subject')">{{ getEditFieldError('subject') }}</small>
          </div>
          <div class="field-group" *ngIf="isEditStudentSelected()">
            <input pInputText type="text" placeholder="Student First Name" formControlName="firstName" />
            <small class="field-error" *ngIf="getEditFieldError('firstName')">{{ getEditFieldError('firstName') }}</small>
          </div>
          <div class="field-group" *ngIf="isEditStudentSelected()">
            <input pInputText type="text" placeholder="Student Last Name" formControlName="lastName" />
            <small class="field-error" *ngIf="getEditFieldError('lastName')">{{ getEditFieldError('lastName') }}</small>
          </div>
          <div class="field-group" *ngIf="isEditStudentSelected()">
            <input pInputText type="text" placeholder="Grade" formControlName="grade" />
            <small class="field-error" *ngIf="getEditFieldError('grade')">{{ getEditFieldError('grade') }}</small>
          </div>
          <div class="field-group" *ngIf="isEditGuardianSelected()">
            <input pInputText type="text" placeholder="Relationship" formControlName="relationship" />
            <small class="field-error" *ngIf="getEditFieldError('relationship')">{{ getEditFieldError('relationship') }}</small>
          </div>
          <div class="field-group action-group">
            <button pButton type="submit" label="Save Changes" icon="pi pi-save" [loading]="loading" [disabled]="loading || editForm.invalid"></button>
          </div>
        </form>

        <p class="message info" *ngIf="editRoleHelperText">{{ editRoleHelperText }}</p>
      </section>

      <section class="controls-grid">
        <form [formGroup]="filterForm" class="filter-card">
          <div class="field-group">
            <input pInputText type="text" placeholder="Search email, role, or profile" formControlName="search" />
          </div>
          <div class="field-group">
            <select formControlName="role">
              <option *ngFor="let option of roleFilterOptions" [value]="option">{{ option }}</option>
            </select>
          </div>
          <div class="field-group">
            <select formControlName="status">
              <option *ngFor="let option of statusFilterOptions" [value]="option">{{ option }}</option>
            </select>
          </div>
          <div class="field-group action-group">
            <button pButton type="button" label="Clear Filters" severity="secondary" [outlined]="true" (click)="clearFilters()"></button>
          </div>
        </form>

        <section class="bulk-card">
          <div class="bulk-header">
            <h3>Bulk actions</h3>
            <span>{{ selectedUsers.length }} selected</span>
          </div>
          <div class="bulk-actions">
            <div class="field-group">
              <select [formControl]="bulkForm.controls.role">
                <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
              </select>
              <button
                pButton
                type="button"
                label="Apply Role"
                icon="pi pi-users"
                [disabled]="loading || !selectedUsers.length"
                (click)="applyBulkRoleChange()"
              ></button>
            </div>
            <div class="field-group">
              <select [formControl]="bulkForm.controls.status">
                <option *ngFor="let option of bulkStatusOptions" [value]="option.value">{{ option.label }}</option>
              </select>
              <button
                pButton
                type="button"
                label="Apply Status"
                icon="pi pi-bolt"
                severity="secondary"
                [disabled]="loading || !selectedUsers.length"
                (click)="applyBulkStatusChange()"
              ></button>
            </div>
          </div>
          <p class="message info bulk-note">Bulk role changes update the selected accounts one by one.</p>
          <button
            pButton
            type="button"
            label="Delete Selected"
            icon="pi pi-trash"
            severity="danger"
            [disabled]="loading || !selectedUsers.length"
            (click)="applyBulkDelete()"
          ></button>
        </section>
      </section>

      <p-table
        [value]="filteredUsers"
        [loading]="loading"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[10, 25, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
        dataKey="id"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 44px">
              <input
                type="checkbox"
                [checked]="allVisibleSelected"
                [indeterminate]="someVisibleSelected"
                (change)="toggleAllVisible($any($event.target).checked)"
              />
            </th>
            <th>Email</th>
            <th>Roles</th>
            <th>Profile</th>
            <th>Status</th>
            <th style="width: 240px">Action</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-user>
          <tr>
            <td>
              <input
                type="checkbox"
                [checked]="isSelected(user)"
                (change)="toggleSelection(user, $any($event.target).checked)"
              />
            </td>
            <td>{{ user.email }}</td>
            <td>
              <div class="role-badges">
                <span
                  class="role-badge"
                  *ngFor="let role of getOrderedRoles(user)"
                  [ngClass]="getRoleBadgeClass(role)"
                >
                  {{ role }}
                </span>
              </div>
            </td>
            <td>{{ describeProfile(user) }}</td>
            <td>{{ user.active ? 'Active' : 'Disabled' }}</td>
            <td class="action-buttons">
              <button
                pButton
                type="button"
                size="small"
                label="Edit"
                icon="pi pi-pencil"
                [disabled]="loading"
                (click)="startEdit(user)"
              ></button>
              <button
                pButton
                type="button"
                size="small"
                [label]="user.active ? 'Disable' : 'Activate'"
                severity="secondary"
                [disabled]="loading"
                (click)="toggleActive(user)"
              ></button>
              <button
                pButton
                type="button"
                size="small"
                label="Delete"
                severity="danger"
                [disabled]="loading"
                (click)="deleteUser(user)"
              ></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6">No users found.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { color: #1976d2; margin-bottom: 1rem; }
    .form-card {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.5rem;
      margin-bottom: 1rem;
      align-items: start;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .action-group {
      justify-content: flex-start;
    }
    .edit-card {
      border: 1px solid #d6e4f0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      background: #f8fbff;
    }
    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .edit-header h3 {
      margin: 0;
      color: #0d47a1;
    }
    .edit-email {
      margin: 0 0 0.75rem;
      color: #455a64;
    }
    input, select {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .field-error {
      color: #c62828;
      font-size: 0.8rem;
    }
    .message { margin-bottom: 0.7rem; }
    .message.info { color: #1565c0; }
    .message.success { color: #2e7d32; }
    .message.error { color: #c62828; }
    .summary-card,
    .bulk-card,
    .filter-card {
      border: 1px solid #d6e4f0;
      border-radius: 8px;
      padding: 0.9rem;
      background: #fff;
      margin-bottom: 1rem;
    }
    .summary-card {
      background: #f8fbff;
    }
    .summary-header,
    .bulk-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      gap: 0.5rem;
    }
    .summary-header h3,
    .bulk-header h3 {
      margin: 0;
      color: #0d47a1;
      font-size: 1rem;
    }
    .summary-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .summary-card ul {
      margin: 0;
      padding-left: 1.1rem;
    }
    .summary-card li {
      margin: 0.2rem 0;
      color: #37474f;
      font-size: 0.92rem;
    }
    .summary-note {
      margin: 0.65rem 0 0;
      font-size: 0.85rem;
    }
    .controls-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: start;
    }
    .filter-card {
      margin-bottom: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.5rem;
      align-items: start;
    }
    .bulk-card {
      margin-bottom: 0;
    }
    .bulk-actions {
      display: grid;
      gap: 0.75rem;
    }
    .bulk-note {
      margin: 0.6rem 0 0;
      font-size: 0.85rem;
    }
    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .role-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
    .role-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 0.1rem 0.55rem;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      border: 1px solid transparent;
    }
    .role-badge-admin {
      color: #0c4a6e;
      background: #e0f2fe;
      border-color: #bae6fd;
    }
    .role-badge-teacher {
      color: #14532d;
      background: #dcfce7;
      border-color: #bbf7d0;
    }
    .role-badge-student {
      color: #4a044e;
      background: #f5d0fe;
      border-color: #e9d5ff;
    }
    .role-badge-guardian {
      color: #7c2d12;
      background: #ffedd5;
      border-color: #fed7aa;
    }
  `]
})
export class UsersListComponent implements OnInit {
  readonly roles: UserRole[] = ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'];
  readonly roleFilterOptions: Array<UserRole | 'ALL'> = ['ALL', ...this.roles];
  readonly statusFilterOptions: Array<'ALL' | 'ACTIVE' | 'DISABLED'> = ['ALL', 'ACTIVE', 'DISABLED'];
  readonly bulkStatusOptions: Array<{ label: string; value: 'ACTIVE' | 'DISABLED' }> = [
    { label: 'Set Active', value: 'ACTIVE' },
    { label: 'Set Disabled', value: 'DISABLED' }
  ];
  readonly auditActionLabels: Record<string, string> = {
    USER_CREATE: 'User created',
    USER_UPDATE: 'User updated',
    USER_DELETE: 'User deleted',
    USER_STATUS_UPDATE: 'User status updated'
  };

  users: AdminUser[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  selectedUser: AdminUser | null = null;
  selectedUsers: AdminUser[] = [];
  auditSummaries: string[] = [];
  auditActionFilter: string | null = null;

  createForm;
  editForm;
  filterForm;
  bulkForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly usersAdminService: UsersAdminService
  ) {
    this.createForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['STUDENT', Validators.required],
      firstName: [''],
      lastName: [''],
      grade: [''],
      name: [''],
      subject: [''],
      relationship: ['']
    });

    this.editForm = this.fb.group({
      role: ['STUDENT', Validators.required],
      password: ['', Validators.minLength(6)],
      firstName: [''],
      lastName: [''],
      grade: [''],
      name: [''],
      subject: [''],
      relationship: ['']
    });

    this.filterForm = this.fb.group({
      search: [''],
      role: ['ALL'],
      status: ['ALL']
    });

    this.bulkForm = this.fb.group({
      role: ['TEACHER'],
      status: ['ACTIVE']
    });
  }

  ngOnInit(): void {
    this.createForm.controls.role.valueChanges.subscribe(role => {
      this.updateRoleSpecificValidators(this.createForm, role as UserRole);
    });

    this.editForm.controls.role.valueChanges.subscribe(role => {
      this.updateRoleSpecificValidators(this.editForm, role as UserRole);
    });

    this.updateRoleSpecificValidators(this.createForm, this.createForm.controls.role.value as UserRole);
    this.updateRoleSpecificValidators(this.editForm, this.editForm.controls.role.value as UserRole);
    this.loadUsers();
  }

  get filteredUsers(): AdminUser[] {
    const search = (this.filterForm.controls.search.value || '').trim().toLowerCase();
    const roleFilter = this.filterForm.controls.role.value as UserRole | 'ALL';
    const statusFilter = this.filterForm.controls.status.value as 'ALL' | 'ACTIVE' | 'DISABLED';

    return this.users.filter(user => {
      if (roleFilter !== 'ALL' && this.getPrimaryRole(user) !== roleFilter) {
        return false;
      }

      if (statusFilter === 'ACTIVE' && !user.active) {
        return false;
      }

      if (statusFilter === 'DISABLED' && user.active) {
        return false;
      }

      if (!search) {
        return true;
      }

      return this.getSearchText(user).includes(search);
    });
  }

  get allVisibleSelected(): boolean {
    return this.filteredUsers.length > 0 && this.filteredUsers.every(user => this.isSelected(user));
  }

  get someVisibleSelected(): boolean {
    return this.filteredUsers.some(user => this.isSelected(user)) && !this.allVisibleSelected;
  }

  isTeacherSelected(): boolean {
    return this.createForm.controls.role.value === 'TEACHER';
  }

  isStudentSelected(): boolean {
    return this.createForm.controls.role.value === 'STUDENT';
  }

  isGuardianSelected(): boolean {
    return this.createForm.controls.role.value === 'GUARDIAN';
  }

  isEditTeacherSelected(): boolean {
    return this.editForm.controls.role.value === 'TEACHER';
  }

  isEditStudentSelected(): boolean {
    return this.editForm.controls.role.value === 'STUDENT';
  }

  isEditGuardianSelected(): boolean {
    return this.editForm.controls.role.value === 'GUARDIAN';
  }

  get roleHelperText(): string {
    return this.getRoleHelperText(this.createForm.controls.role.value as UserRole);
  }

  get editRoleHelperText(): string {
    return this.getRoleHelperText(this.editForm.controls.role.value as UserRole);
  }

  get auditQueryParams(): Record<string, string> {
    if (!this.auditActionFilter) {
      return {};
    }

    return { action: this.auditActionFilter };
  }

  get auditActionLabel(): string | null {
    if (!this.auditActionFilter) {
      return null;
    }

    return this.auditActionLabels[this.auditActionFilter] ?? this.auditActionFilter;
  }

  clearAuditFilter(): void {
    this.auditActionFilter = null;
  }

  openAuditLogsShortcut(): void {
    if (!this.auditActionFilter) {
      return;
    }

    // Delay clear until after the click navigation consumes query params.
    setTimeout(() => {
      this.clearAuditFilter();
    }, 0);
  }

  startEdit(user: AdminUser): void {
    const role = this.getPrimaryRole(user);
    this.selectedUser = user;
    this.errorMessage = '';
    this.successMessage = '';

    this.editForm.reset({
      role,
      password: '',
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      grade: user.grade ?? '',
      name: user.name ?? '',
      subject: user.subject ?? '',
      relationship: user.relationship ?? ''
    });
    this.updateRoleSpecificValidators(this.editForm, role);
  }

  cancelEdit(): void {
    this.selectedUser = null;
    this.editForm.reset({
      role: 'STUDENT',
      password: '',
      firstName: '',
      lastName: '',
      grade: '',
      name: '',
      subject: '',
      relationship: ''
    });
    this.updateRoleSpecificValidators(this.editForm, this.editForm.controls.role.value as UserRole);
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      role: 'ALL',
      status: 'ALL'
    });
  }

  isSelected(user: AdminUser): boolean {
    return this.selectedUsers.some(selected => selected.id === user.id);
  }

  toggleSelection(user: AdminUser, checked: boolean): void {
    if (checked) {
      if (!this.isSelected(user)) {
        this.selectedUsers = [...this.selectedUsers, user];
      }
      return;
    }

    this.selectedUsers = this.selectedUsers.filter(selected => selected.id !== user.id);
  }

  toggleAllVisible(checked: boolean): void {
    const visibleIds = new Set(this.filteredUsers.map(user => user.id));

    if (checked) {
      const merged = [...this.selectedUsers];
      this.filteredUsers.forEach(user => {
        if (!merged.some(selected => selected.id === user.id)) {
          merged.push(user);
        }
      });
      this.selectedUsers = merged;
      return;
    }

    this.selectedUsers = this.selectedUsers.filter(user => !visibleIds.has(user.id));
  }

  describeProfile(user: AdminUser): string {
    const role = this.getPrimaryRole(user);
    switch (role) {
      case 'TEACHER':
        return [user.name, user.subject].filter(Boolean).join(' • ') || '—';
      case 'STUDENT':
        return [
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
          user.grade ? `Grade ${user.grade}` : null
        ].filter(Boolean).join(' • ') || '—';
      case 'GUARDIAN':
        return user.relationship || '—';
      default:
        return '—';
    }
  }

  getOrderedRoles(user: Pick<AdminUser, 'roles'>): UserRole[] {
    const priority: UserRole[] = ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'];
    return priority.filter(role => user.roles.includes(role));
  }

  getRoleBadgeClass(role: UserRole): string {
    const classMap: Record<UserRole, string> = {
      ADMIN: 'role-badge-admin',
      TEACHER: 'role-badge-teacher',
      STUDENT: 'role-badge-student',
      GUARDIAN: 'role-badge-guardian'
    };
    return classMap[role];
  }

  applyBulkRoleChange(): void {
    const users = [...this.selectedUsers];
    if (!users.length || this.loading) {
      return;
    }

    const targetRole = this.bulkForm.controls.role.value as UserRole;
    const confirmed = window.confirm(`Apply role ${targetRole} to ${users.length} selected user${users.length === 1 ? '' : 's'}?`);
    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    forkJoin(users.map(user => this.usersAdminService.updateUser(user.id, { roles: [targetRole] })))
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (updatedUsers) => {
          this.users = this.users.map(user => updatedUsers.find(updated => updated.id === user.id) ?? user);
          this.successMessage = `Updated ${users.length} user${users.length === 1 ? '' : 's'} to ${targetRole}.`;
          this.recordAuditSummary(
            `Bulk role update: ${users.length} user${users.length === 1 ? '' : 's'} set to ${targetRole}.`,
            'USER_UPDATE'
          );
          this.selectedUsers = [];
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to update selected users';
        }
      });
  }

  applyBulkStatusChange(): void {
    const users = [...this.selectedUsers].filter(user => this.users.some(current => current.id === user.id));
    if (!users.length || this.loading) {
      return;
    }

    const statusValue = this.bulkForm.controls.status.value as 'ACTIVE' | 'DISABLED';
    const active = statusValue === 'ACTIVE';
    const label = active ? 'active' : 'disabled';
    const confirmed = window.confirm(`Set ${users.length} selected user${users.length === 1 ? '' : 's'} to ${label}?`);
    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    forkJoin(users.map(user => this.usersAdminService.setUserActive(user.id, active)))
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (updatedUsers) => {
          this.users = this.users.map(user => updatedUsers.find(updated => updated.id === user.id) ?? user);
          this.successMessage = `Updated ${users.length} user${users.length === 1 ? '' : 's'} to ${label}.`;
          this.recordAuditSummary(
            `Bulk status update: ${users.length} user${users.length === 1 ? '' : 's'} set to ${label}.`,
            'USER_STATUS_UPDATE'
          );
          this.selectedUsers = [];
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to update selected user status';
        }
      });
  }

  applyBulkDelete(): void {
    const users = [...this.selectedUsers].filter(user => this.users.some(current => current.id === user.id));
    if (!users.length || this.loading) {
      return;
    }

    const confirmed = window.confirm(`Delete ${users.length} selected user${users.length === 1 ? '' : 's'}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    forkJoin(users.map(user => this.usersAdminService.deleteUser(user.id)))
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: () => {
          const deletedIds = new Set(users.map(user => user.id));
          this.users = this.users.filter(user => !deletedIds.has(user.id));
          this.selectedUsers = [];

          if (this.selectedUser && deletedIds.has(this.selectedUser.id)) {
            this.cancelEdit();
          }

          this.successMessage = `Deleted ${users.length} user${users.length === 1 ? '' : 's'}.`;
          this.recordAuditSummary(`Bulk delete: ${users.length} user${users.length === 1 ? '' : 's'} deleted.`, 'USER_DELETE');
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to delete selected users';
        }
      });
  }

  saveUser(): void {
    if (!this.selectedUser) {
      return;
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.getRawValue();
    const role = formValue.role as UserRole;
    const payload: UpdateAdminUserRequest = {
      roles: [role],
      ...this.buildRolePayload(formValue, role),
      ...(formValue.password?.trim() ? { password: formValue.password.trim() } : {})
    };

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersAdminService.updateUser(this.selectedUser.id, payload)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (updated) => {
          this.users = this.users.map(user => user.id === updated.id ? updated : user);
          this.successMessage = `Updated ${role.toLowerCase()} account for ${updated.email}.`;
          this.recordAuditSummary(`Updated ${role.toLowerCase()} user ${updated.email}.`, 'USER_UPDATE');
          this.cancelEdit();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to update user';
        }
      });
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.usersAdminService.listUsers()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.selectedUsers = this.selectedUsers.filter(selected => users.some(user => user.id === selected.id));
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load users';
        }
      });
  }

  createUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const formValue = this.createForm.value;
    const role = formValue.role as UserRole;
    const payload: CreateAdminUserRequest = {
      email: formValue.email || '',
      password: formValue.password || '',
      roles: [role],
      ...this.buildRolePayload(formValue, role)
    };

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersAdminService.createUser(payload)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: () => {
          this.createForm.reset({
            email: '',
            password: '',
            role: 'STUDENT',
            firstName: '',
            lastName: '',
            grade: '',
            name: '',
            subject: '',
            relationship: ''
          });
          this.successMessage = `Created ${role.toLowerCase()} account for ${payload.email}.`;
          this.recordAuditSummary(`Created ${role.toLowerCase()} user ${payload.email}.`, 'USER_CREATE');
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to create user';
        }
      });
  }

  getFieldError(controlName: string): string | null {
    return this.getFormFieldError(this.createForm.get(controlName), controlName);
  }

  getEditFieldError(controlName: string): string | null {
    return this.getFormFieldError(this.editForm.get(controlName), controlName);
  }

  private updateRoleSpecificValidators(form: any, role: UserRole): void {
    const firstNameControl = form.controls.firstName;
    const lastNameControl = form.controls.lastName;
    const gradeControl = form.controls.grade;
    const nameControl = form.controls.name;
    const subjectControl = form.controls.subject;
    const relationshipControl = form.controls.relationship;
    const isTeacher = role === 'TEACHER';
    const isStudent = role === 'STUDENT';
    const isGuardian = role === 'GUARDIAN';

    firstNameControl.setValidators(isStudent ? [Validators.required] : []);
    lastNameControl.setValidators(isStudent ? [Validators.required] : []);
    gradeControl.setValidators(isStudent ? [Validators.required] : []);

    nameControl.setValidators(isTeacher ? [Validators.required] : []);
    subjectControl.setValidators(isTeacher ? [Validators.required] : []);
    relationshipControl.setValidators(isGuardian ? [Validators.required] : []);

    if (!isStudent) {
      firstNameControl.setValue('', { emitEvent: false });
      lastNameControl.setValue('', { emitEvent: false });
      gradeControl.setValue('', { emitEvent: false });
    }

    if (!isTeacher) {
      nameControl.setValue('', { emitEvent: false });
      subjectControl.setValue('', { emitEvent: false });
    }

    if (!isGuardian) {
      relationshipControl.setValue('', { emitEvent: false });
    }

    firstNameControl.updateValueAndValidity({ emitEvent: false });
    lastNameControl.updateValueAndValidity({ emitEvent: false });
    gradeControl.updateValueAndValidity({ emitEvent: false });

    nameControl.updateValueAndValidity({ emitEvent: false });
    subjectControl.updateValueAndValidity({ emitEvent: false });
    relationshipControl.updateValueAndValidity({ emitEvent: false });
  }

  private getRoleHelperText(role: UserRole): string {
    switch (role) {
      case 'TEACHER':
        return 'Teacher accounts require a display name and subject, for example: Ms. Hana / Mathematics.';
      case 'STUDENT':
        return 'Student accounts require first name, last name, and grade, for example: Abel / Tesfaye / 7.';
      case 'GUARDIAN':
        return 'Guardian accounts require the relationship to the student, for example: Mother, Father, Aunt, or Uncle.';
      default:
        return 'Admin accounts only require email and password.';
    }
  }

  private buildRolePayload(formValue: any, role: UserRole): Partial<UpdateAdminUserRequest> {
    if (role === 'TEACHER') {
      return {
        name: (formValue.name || '').trim(),
        subject: (formValue.subject || '').trim()
      };
    }

    if (role === 'STUDENT') {
      return {
        firstName: (formValue.firstName || '').trim(),
        lastName: (formValue.lastName || '').trim(),
        grade: (formValue.grade || '').trim()
      };
    }

    if (role === 'GUARDIAN') {
      return {
        relationship: (formValue.relationship || '').trim()
      };
    }

    return {};
  }

  private recordAuditSummary(summary: string, action?: string): void {
    this.auditSummaries = [summary, ...this.auditSummaries].slice(0, 5);
    if (action) {
      this.auditActionFilter = action;
    }
  }

  private getSearchText(user: AdminUser): string {
    return [
      user.email,
      user.roles.join(' '),
      this.describeProfile(user),
      user.active ? 'active' : 'disabled'
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private getPrimaryRole(user: Pick<AdminUser, 'roles'>): UserRole {
    return this.getOrderedRoles(user)[0] ?? user.roles[0] ?? 'STUDENT';
  }

  private getFormFieldError(control: AbstractControl | null, controlName: string): string | null {
    if (!control || !control.invalid || !(control.touched || control.dirty)) {
      return null;
    }

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(controlName)} is required.`;
    }

    if (control?.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(controlName)} must be at least 6 characters.`;
    }

    return 'Invalid value.';
  }

  private getFieldLabel(controlName: string): string {
    const labels: Record<string, string> = {
      email: 'Email',
      password: 'Password',
      name: 'Teacher name',
      subject: 'Subject',
      firstName: 'Student first name',
      lastName: 'Student last name',
      grade: 'Grade',
      relationship: 'Relationship'
    };

    return labels[controlName] ?? 'Field';
  }

  toggleActive(user: AdminUser): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersAdminService.setUserActive(user.id, !user.active)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (updated) => {
          this.users = this.users.map(u => u.id === updated.id ? updated : u);
          this.successMessage = `Updated status for ${updated.email} to ${updated.active ? 'active' : 'disabled'}.`;
          this.recordAuditSummary(
            `Updated status for ${updated.email} to ${updated.active ? 'active' : 'disabled'}.`,
            'USER_STATUS_UPDATE'
          );
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to update user status';
        }
      });
  }

  deleteUser(user: AdminUser): void {
    const confirmed = window.confirm(`Delete ${user.email}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersAdminService.deleteUser(user.id)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.successMessage = `Deleted user ${user.email}.`;
          this.recordAuditSummary(`Deleted user ${user.email}.`, 'USER_DELETE');
          if (this.selectedUser?.id === user.id) {
            this.cancelEdit();
          }
          this.selectedUsers = this.selectedUsers.filter(selected => selected.id !== user.id);
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to delete user';
        }
      });
  }
}
