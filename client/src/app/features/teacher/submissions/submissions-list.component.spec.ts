import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TeacherSubmissionsComponent } from './submissions-list.component';
import { TeacherHomeworkService } from '../homework/teacher-homework.service';
import { TeacherSubmissionsService } from './teacher-submissions.service';
import { NotificationService } from '../../../shared/services/notification.service';

function createComponent(): TeacherSubmissionsComponent {
  const homeworkServiceMock: Partial<TeacherHomeworkService> = {
    listClasses: () => of([]),
    listHomework: () => of([])
  };

  const submissionsServiceMock: Partial<TeacherSubmissionsService> = {
    listSubmissions: () => of([]),
    updateSubmission: () => of({ id: 's1', homeworkId: 'h1', studentId: 'u1', status: 'GRADED' }),
    downloadFile: () => of(new Blob())
  };

  const notificationServiceMock: Partial<NotificationService> = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  };

  return new TeacherSubmissionsComponent(
    new FormBuilder(),
    homeworkServiceMock as TeacherHomeworkService,
    submissionsServiceMock as TeacherSubmissionsService,
    notificationServiceMock as NotificationService
  );
}

describe('TeacherSubmissionsComponent', () => {
  it('returns warn severity for RETURNED status', () => {
    const component = createComponent();
    expect(component.statusSeverity('RETURNED')).toBe('warn');
  });

  it('returns danger severity for LATE status', () => {
    const component = createComponent();
    expect(component.statusSeverity('LATE')).toBe('danger');
  });

  it('filters submissions by student, status, and submitted date range', () => {
    const component = createComponent();
    component.submissionRows = [
      {
        id: 's1',
        homeworkId: 'h1',
        studentId: 'u1',
        studentEmail: 'student1@school.test',
        submittedAt: '2026-05-20T10:30:00Z',
        status: 'SUBMITTED'
      },
      {
        id: 's2',
        homeworkId: 'h1',
        studentId: 'u2',
        studentEmail: 'student2@school.test',
        submittedAt: '2026-05-10T09:00:00Z',
        status: 'LATE'
      }
    ];

    component.studentSearch = 'student1';
    component.selectedSubmissionStatus = 'SUBMITTED';
    component.submittedFrom = '2026-05-19';
    component.submittedTo = '2026-05-21';

    expect(component.filteredSubmissions.map(r => r.id)).toEqual(['s1']);
  });

  it('clearSubmissionFilters resets all submission filter inputs', () => {
    const component = createComponent();
    component.studentSearch = 'abc';
    component.selectedSubmissionStatus = 'LATE';
    component.submittedFrom = '2026-05-01';
    component.submittedTo = '2026-05-31';

    component.clearSubmissionFilters();

    expect(component.studentSearch).toBe('');
    expect(component.selectedSubmissionStatus).toBe('ALL');
    expect(component.submittedFrom).toBe('');
    expect(component.submittedTo).toBe('');
  });
});

