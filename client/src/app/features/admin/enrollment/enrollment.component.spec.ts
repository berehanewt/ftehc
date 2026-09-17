import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AdminEnrollmentsComponent } from './enrollment.component';
import { EnrollmentAdminService } from './enrollment-admin.service';
import { NotificationService } from '../../../shared/services/notification.service';

function createComponent(): AdminEnrollmentsComponent {
  const enrollmentServiceMock: Partial<EnrollmentAdminService> = {
    listClasses: () => of([]),
    listStudents: () => of([]),
    enrollStudent: () => of({ id: 'c1', name: 'Class', studentIds: [] }),
    removeStudent: () => of({ id: 'c1', name: 'Class', studentIds: [] })
  };

  const notificationServiceMock: Partial<NotificationService> = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  };

  return new AdminEnrollmentsComponent(
    new FormBuilder(),
    enrollmentServiceMock as EnrollmentAdminService,
    notificationServiceMock as NotificationService
  );
}

describe('AdminEnrollmentsComponent filtering', () => {
  it('keeps student options empty until class is selected', () => {
    const component = createComponent();
    component.students = [
      { id: 's1', firstName: 'A', lastName: 'One', grade: '7' }
    ];

    (component as any).updateStudentOptions();

    expect(component.studentOptions).toEqual([]);
  });

  it('excludes already enrolled students from selected class options', () => {
    const component = createComponent();
    component.classes = [
      { id: 'c1', name: 'Class 1', grade: '7', studentIds: ['s1'] }
    ];
    component.students = [
      { id: 's1', firstName: 'A', lastName: 'One', grade: '7' },
      { id: 's2', firstName: 'B', lastName: 'Two', grade: '7' }
    ];

    component.enrollmentForm.patchValue({ classId: 'c1' });
    (component as any).updateStudentOptions();

    expect(component.studentOptions.map(o => o.value)).toEqual(['s2']);
  });

  it('clears selected student when class changes and selection becomes invalid', () => {
    const component = createComponent();
    component.classes = [
      { id: 'c1', name: 'Class 1', grade: '7', studentIds: ['s1'] }
    ];
    component.students = [
      { id: 's1', firstName: 'A', lastName: 'One', grade: '7' },
      { id: 's2', firstName: 'B', lastName: 'Two', grade: '7' }
    ];

    component.enrollmentForm.patchValue({ classId: 'c1', studentId: 's1' });
    (component as any).updateStudentOptions();

    expect(component.enrollmentForm.controls.studentId.value).toBeNull();
  });
});

