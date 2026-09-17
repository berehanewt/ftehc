import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { StudentSubmissionsComponent } from './student-submissions.component';
import { StudentSubmissionsService } from './student-submissions.service';
import { NotificationService } from '../../../shared/services/notification.service';

function createComponent(): StudentSubmissionsComponent {
  const serviceMock: Partial<StudentSubmissionsService> = {
    listMySubmissions: () => of([]),
    downloadFile: () => of(new Blob())
  };

  const notificationMock: Partial<NotificationService> = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  };

  return new StudentSubmissionsComponent(
    serviceMock as StudentSubmissionsService,
    notificationMock as NotificationService
  );
}

describe('StudentSubmissionsComponent', () => {
  it('returns warn severity for RETURNED', () => {
    const component = createComponent();
    expect(component.statusSeverity('RETURNED')).toBe('warn');
  });

  it('returns danger severity for LATE', () => {
    const component = createComponent();
    expect(component.statusSeverity('LATE')).toBe('danger');
  });
});

