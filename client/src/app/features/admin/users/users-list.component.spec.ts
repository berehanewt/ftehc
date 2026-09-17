import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { UsersListComponent } from './users-list.component';
import { UsersAdminService } from './users-admin.service';

function createComponent() {
  const usersAdminServiceMock = {
    listUsers: vi.fn(() => of([])),
    createUser: vi.fn(() => of({
      id: 'u1',
      email: 'teacher1@school.com',
      roles: ['TEACHER'],
      active: true
    })),
    updateUser: vi.fn((id: string, payload: any) => of({
      id,
      email: 'teacher1@school.com',
      roles: payload.roles ?? ['TEACHER'],
      active: true,
      ...payload
    })),
    deleteUser: vi.fn(() => of(void 0)),
    setUserActive: vi.fn()
  };

  const component = new UsersListComponent(
    new FormBuilder(),
    usersAdminServiceMock as unknown as UsersAdminService
  );

  return { component, usersAdminServiceMock };
}

describe('UsersListComponent teacher creation', () => {
  it('requires teacher name and subject when teacher role is selected', () => {
    const { component } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({
      email: 'teacher1@school.com',
      password: 'Teacher123!',
      role: 'TEACHER',
      name: '',
      subject: ''
    });

    expect(component.isTeacherSelected()).toBe(true);
    expect(component.createForm.controls.name.hasError('required')).toBe(true);
    expect(component.createForm.controls.subject.hasError('required')).toBe(true);
    expect(component.createForm.invalid).toBe(true);
  });

  it('returns inline validation messages for shared and role-specific fields', () => {
    const { component } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({ role: 'TEACHER' });
    component.createForm.controls.email.markAsTouched();
    component.createForm.controls.password.markAsTouched();
    component.createForm.controls.name.markAsTouched();

    expect(component.getFieldError('email')).toBe('Email is required.');
    expect(component.getFieldError('password')).toBe('Password is required.');
    expect(component.getFieldError('name')).toBe('Teacher name is required.');
  });

  it('marks all controls touched when create user is attempted with invalid form', () => {
    const { component, usersAdminServiceMock } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({ role: 'GUARDIAN' });
    component.createUser();

    expect(usersAdminServiceMock.createUser).not.toHaveBeenCalled();
    expect(component.createForm.controls.email.touched).toBe(true);
    expect(component.createForm.controls.password.touched).toBe(true);
    expect(component.createForm.controls.relationship.touched).toBe(true);
  });

  it('clears teacher-only validators and values when switching away from teacher role', () => {
    const { component } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({
      role: 'TEACHER',
      name: 'Ms. Hana',
      subject: 'Mathematics'
    });

    component.createForm.patchValue({ role: 'STUDENT' });

    expect(component.isTeacherSelected()).toBe(false);
    expect(component.createForm.controls.name.value).toBe('');
    expect(component.createForm.controls.subject.value).toBe('');
    expect(component.createForm.controls.name.errors).toBeNull();
    expect(component.createForm.controls.subject.errors).toBeNull();
  });

  it('requires student profile fields when student role is selected', () => {
    const { component } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({
      email: 'student1@school.com',
      password: 'Student123!',
      role: 'STUDENT',
      firstName: '',
      lastName: '',
      grade: ''
    });

    expect(component.isStudentSelected()).toBe(true);
    expect(component.createForm.controls.firstName.hasError('required')).toBe(true);
    expect(component.createForm.controls.lastName.hasError('required')).toBe(true);
    expect(component.createForm.controls.grade.hasError('required')).toBe(true);
  });

  it('requires relationship when guardian role is selected', () => {
    const { component } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({
      email: 'guardian1@school.com',
      password: 'Guardian123!',
      role: 'GUARDIAN',
      relationship: ''
    });

    expect(component.isGuardianSelected()).toBe(true);
    expect(component.createForm.controls.relationship.hasError('required')).toBe(true);
  });

  it('returns role-specific helper text for teacher, student, and guardian selections', () => {
    const { component } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({ role: 'TEACHER' });
    expect(component.roleHelperText).toContain('display name and subject');

    component.createForm.patchValue({ role: 'STUDENT' });
    expect(component.roleHelperText).toContain('first name, last name, and grade');

    component.createForm.patchValue({ role: 'GUARDIAN' });
    expect(component.roleHelperText).toContain('relationship to the student');
  });

  it('prefills edit form and helper text from the selected user profile', () => {
    const { component } = createComponent();
    component.ngOnInit();

    component.startEdit({
      id: 'u1',
      email: 'teacher1@school.com',
      roles: ['TEACHER'],
      active: true,
      name: 'Ms. Hana',
      subject: 'Mathematics'
    });

    expect(component.selectedUser?.email).toBe('teacher1@school.com');
    expect(component.editForm.controls.role.value).toBe('TEACHER');
    expect(component.editForm.controls.name.value).toBe('Ms. Hana');
    expect(component.editRoleHelperText).toContain('display name and subject');
  });

  it('sends teacher name and subject in the create payload', () => {
    const { component, usersAdminServiceMock } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({
      email: 'teacher1@school.com',
      password: 'Teacher123!',
      role: 'TEACHER',
      name: 'Ms. Hana ',
      subject: ' Mathematics '
    });

    component.createUser();

    expect(usersAdminServiceMock.createUser).toHaveBeenCalledWith({
      email: 'teacher1@school.com',
      password: 'Teacher123!',
      roles: ['TEACHER'],
      name: 'Ms. Hana',
      subject: 'Mathematics'
    });
  });

  it('sends student profile fields in the create payload', () => {
    const { component, usersAdminServiceMock } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({
      email: 'student1@school.com',
      password: 'Student123!',
      role: 'STUDENT',
      firstName: ' Abel ',
      lastName: ' Tesfaye ',
      grade: ' 7 '
    });

    component.createUser();

    expect(usersAdminServiceMock.createUser).toHaveBeenCalledWith({
      email: 'student1@school.com',
      password: 'Student123!',
      roles: ['STUDENT'],
      firstName: 'Abel',
      lastName: 'Tesfaye',
      grade: '7'
    });
  });

  it('sends guardian relationship in the create payload', () => {
    const { component, usersAdminServiceMock } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({
      email: 'guardian1@school.com',
      password: 'Guardian123!',
      role: 'GUARDIAN',
      relationship: ' Aunt '
    });

    component.createUser();

    expect(usersAdminServiceMock.createUser).toHaveBeenCalledWith({
      email: 'guardian1@school.com',
      password: 'Guardian123!',
      roles: ['GUARDIAN'],
      relationship: 'Aunt'
    });
  });

  it('sets a success message after creating a teacher account', () => {
    const { component } = createComponent();
    component.ngOnInit();

    component.createForm.patchValue({
      email: 'teacher1@school.com',
      password: 'Teacher123!',
      role: 'TEACHER',
      name: 'Ms. Hana',
      subject: 'Mathematics'
    });

    component.createUser();

    expect(component.successMessage).toBe('Created teacher account for teacher1@school.com.');
  });

  it('describes profile details for teacher, student, guardian, and admin users', () => {
    const { component } = createComponent();

    expect(component.describeProfile({
      id: 't1', email: 't@school.com', roles: ['TEACHER'], active: true, name: 'Ms. Hana', subject: 'Math'
    })).toBe('Ms. Hana • Math');

    expect(component.describeProfile({
      id: 's1', email: 's@school.com', roles: ['STUDENT'], active: true, firstName: 'Abel', lastName: 'Tesfaye', grade: '7'
    })).toBe('Abel Tesfaye • Grade 7');

    expect(component.describeProfile({
      id: 'g1', email: 'g@school.com', roles: ['GUARDIAN'], active: true, relationship: 'Mother'
    })).toBe('Mother');

    expect(component.describeProfile({
      id: 'a1', email: 'a@school.com', roles: ['ADMIN'], active: true
    })).toBe('—');
  });

  it('sends updated student profile fields and password through the edit form', () => {
    const { component, usersAdminServiceMock } = createComponent();
    component.ngOnInit();

    component.startEdit({
      id: 'u2',
      email: 'student1@school.com',
      roles: ['STUDENT'],
      active: true,
      firstName: 'Abel',
      lastName: 'Tesfaye',
      grade: '7'
    });

    component.editForm.patchValue({
      firstName: ' Abel ',
      lastName: ' Alemu ',
      grade: ' 8 ',
      password: 'Student456!'
    });

    component.saveUser();

    expect(usersAdminServiceMock.updateUser).toHaveBeenCalledWith('u2', {
      roles: ['STUDENT'],
      password: 'Student456!',
      firstName: 'Abel',
      lastName: 'Alemu',
      grade: '8'
    });
    expect(component.successMessage).toBe('Updated student account for teacher1@school.com.');
  });

  it('marks edit form controls touched when save is attempted with invalid values', () => {
    const { component, usersAdminServiceMock } = createComponent();
    component.ngOnInit();

    component.startEdit({
      id: 'u3',
      email: 'guardian1@school.com',
      roles: ['GUARDIAN'],
      active: true,
      relationship: 'Mother'
    });
    component.editForm.patchValue({ relationship: '' });

    component.saveUser();

    expect(usersAdminServiceMock.updateUser).not.toHaveBeenCalled();
    expect(component.editForm.controls.relationship.touched).toBe(true);
  });

  it('deletes a user after confirmation and removes it from the table list', () => {
    const { component, usersAdminServiceMock } = createComponent();
    component.ngOnInit();
    component.users = [
      {
        id: 'u1',
        email: 'teacher1@school.com',
        roles: ['TEACHER'],
        active: true
      },
      {
        id: 'u2',
        email: 'student1@school.com',
        roles: ['STUDENT'],
        active: true
      }
    ];

    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('window', { confirm: confirmSpy });

    component.deleteUser(component.users[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(usersAdminServiceMock.deleteUser).toHaveBeenCalledWith('u1');
    expect(component.users.map(user => user.id)).toEqual(['u2']);
    expect(component.successMessage).toBe('Deleted user teacher1@school.com.');

    vi.unstubAllGlobals();
  });

  it('does not delete a user when confirmation is canceled', () => {
    const { component, usersAdminServiceMock } = createComponent();
    component.ngOnInit();
    component.users = [
      {
        id: 'u1',
        email: 'teacher1@school.com',
        roles: ['TEACHER'],
        active: true
      }
    ];

    const confirmSpy = vi.fn(() => false);
    vi.stubGlobal('window', { confirm: confirmSpy });

    component.deleteUser(component.users[0]);

    expect(usersAdminServiceMock.deleteUser).not.toHaveBeenCalled();
    expect(component.users).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it('bulk deletes selected users and sets audit filter query to USER_DELETE', () => {
    const { component, usersAdminServiceMock } = createComponent();
    component.ngOnInit();
    component.users = [
      {
        id: 'u1',
        email: 'teacher1@school.com',
        roles: ['TEACHER'],
        active: true
      },
      {
        id: 'u2',
        email: 'student1@school.com',
        roles: ['STUDENT'],
        active: true
      },
      {
        id: 'u3',
        email: 'guardian1@school.com',
        roles: ['GUARDIAN'],
        active: true
      }
    ];
    component.selectedUsers = [component.users[0], component.users[2]];

    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('window', { confirm: confirmSpy });

    component.applyBulkDelete();

    expect(confirmSpy).toHaveBeenCalled();
    expect(usersAdminServiceMock.deleteUser).toHaveBeenCalledTimes(2);
    expect(usersAdminServiceMock.deleteUser).toHaveBeenNthCalledWith(1, 'u1');
    expect(usersAdminServiceMock.deleteUser).toHaveBeenNthCalledWith(2, 'u3');
    expect(component.users.map(user => user.id)).toEqual(['u2']);
    expect(component.selectedUsers).toEqual([]);
    expect(component.successMessage).toBe('Deleted 2 users.');
    expect(component.auditQueryParams).toEqual({ action: 'USER_DELETE' });
    expect(component.auditActionLabel).toBe('User deleted');

    vi.unstubAllGlobals();
  });

  it('clears the audit action filter so audit logs open without prefilled action', () => {
    const { component } = createComponent();
    component.ngOnInit();

    component.auditActionFilter = 'USER_DELETE';
    expect(component.auditQueryParams).toEqual({ action: 'USER_DELETE' });
    expect(component.auditActionLabel).toBe('User deleted');

    component.clearAuditFilter();

    expect(component.auditQueryParams).toEqual({});
    expect(component.auditActionLabel).toBeNull();
  });

  it('clears audit shortcut filter on next tick after opening audit logs', () => {
    const { component } = createComponent();
    component.ngOnInit();
    component.auditActionFilter = 'USER_UPDATE';

    vi.useFakeTimers();
    component.openAuditLogsShortcut();

    expect(component.auditActionFilter).toBe('USER_UPDATE');

    vi.runAllTimers();
    expect(component.auditActionFilter).toBeNull();
    vi.useRealTimers();
  });

  it('orders multi-role badges with ADMIN priority and maps role badge classes', () => {
    const { component } = createComponent();

    expect(component.getOrderedRoles({ roles: ['GUARDIAN', 'ADMIN'] })).toEqual(['ADMIN', 'GUARDIAN']);
    expect(component.getOrderedRoles({ roles: ['STUDENT', 'TEACHER', 'GUARDIAN'] })).toEqual(['TEACHER', 'STUDENT', 'GUARDIAN']);

    expect(component.getRoleBadgeClass('ADMIN')).toBe('role-badge-admin');
    expect(component.getRoleBadgeClass('TEACHER')).toBe('role-badge-teacher');
    expect(component.getRoleBadgeClass('STUDENT')).toBe('role-badge-student');
    expect(component.getRoleBadgeClass('GUARDIAN')).toBe('role-badge-guardian');
  });
});

