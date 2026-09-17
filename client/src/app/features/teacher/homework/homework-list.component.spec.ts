import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TeacherHomeworkComponent } from './homework-list.component';
import { TeacherHomeworkService } from './teacher-homework.service';
import { NotificationService } from '../../../shared/services/notification.service';

function createComponent(): TeacherHomeworkComponent {
  const teacherHomeworkServiceMock: Partial<TeacherHomeworkService> = {
    listClasses: () => of([]),
    listHomework: () => of([]),
    createHomework: () => of({ id: 'h1', classId: 'c1', title: 'Sample', dueDate: '2026-05-20' }),
    deleteHomework: () => of(void 0)
  };

  const notificationServiceMock: Partial<NotificationService> = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  };

  return new TeacherHomeworkComponent(
    new FormBuilder(),
    teacherHomeworkServiceMock as TeacherHomeworkService,
    notificationServiceMock as NotificationService
  );
}

describe('TeacherHomeworkComponent', () => {
  it('returns warn severity when due date is today', () => {
    const component = createComponent();
    const today = new Date().toISOString().slice(0, 10);

    expect(component.dueSeverity(today)).toBe('warn');
  });

  it('returns success severity for future due date', () => {
    const component = createComponent();

    expect(component.dueSeverity('2999-12-31')).toBe('success');
  });
});

