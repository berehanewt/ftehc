import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GuardianHomeworkComponent } from './guardian-homework.component';
import { GuardianHomeworkService } from './guardian-homework.service';
import { NotificationService } from '../../../shared/services/notification.service';

function createComponent(): {
  component: GuardianHomeworkComponent;
  notificationMock: Partial<NotificationService>;
} {
  const serviceMock: Partial<GuardianHomeworkService> = {
    listStudents: () => of([]),
    listHomework: () => of([])
  };

  const notificationMock: Partial<NotificationService> = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  };

  const component = new GuardianHomeworkComponent(
    serviceMock as GuardianHomeworkService,
    notificationMock as NotificationService
  );

  return { component, notificationMock };
}

describe('GuardianHomeworkComponent', () => {
  it('returns warn severity for NOT_SUBMITTED', () => {
    const { component } = createComponent();
    expect(component.statusSeverity('NOT_SUBMITTED')).toBe('warn');
  });

  it('returns success severity for GRADED', () => {
    const { component } = createComponent();
    expect(component.statusSeverity('GRADED')).toBe('success');
  });

  it('filters by title, status, teacher, and due range together', () => {
    const { component } = createComponent();
    component.rows = [
      {
        homeworkId: 'h1',
        title: 'Algebra Worksheet',
        dueDate: '2026-05-20',
        className: 'Class A',
        teacherName: 'Teacher One',
        status: 'SUBMITTED'
      },
      {
        homeworkId: 'h2',
        title: 'Science Report',
        dueDate: '2026-05-18',
        className: 'Class B',
        teacherName: 'Teacher Two',
        status: 'LATE'
      }
    ];

    component.searchTitle = 'algebra';
    component.selectedStatus = 'SUBMITTED';
    component.selectedTeacher = 'Teacher One';
    component.dueFrom = '2026-05-19';
    component.dueTo = '2026-05-21';

    expect(component.filteredRows.map(r => r.homeworkId)).toEqual(['h1']);
  });

  it('clearFilters resets all filter fields to defaults', () => {
    const { component } = createComponent();
    component.searchTitle = 'math';
    component.selectedStatus = 'LATE';
    component.selectedTeacher = 'Teacher X';
    component.dueFrom = '2026-05-01';
    component.dueTo = '2026-05-30';
    component.selectedDuePreset = 'NEXT_7';

    component.clearFilters();

    expect(component.searchTitle).toBe('');
    expect(component.selectedStatus).toBe('ALL');
    expect(component.selectedTeacher).toBe('ALL');
    expect(component.dueFrom).toBe('');
    expect(component.dueTo).toBe('');
    expect(component.selectedDuePreset).toBe('CUSTOM');
  });

  it('applies TODAY due preset as a single-day range', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T09:45:00Z'));

    const { component } = createComponent();
    component.onDuePresetChange('TODAY');

    expect(component.dueFrom).toBe('2026-05-12');
    expect(component.dueTo).toBe('2026-05-12');

    vi.useRealTimers();
  });

  it('applies OVERDUE due preset to yesterday upper bound', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T09:45:00Z'));

    const { component } = createComponent();
    component.onDuePresetChange('OVERDUE');

    expect(component.dueFrom).toBe('');
    expect(component.dueTo).toBe('2026-05-11');

    vi.useRealTimers();
  });

  it('applies NEXT_7 due preset from today through day 7', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T09:45:00Z'));

    const { component } = createComponent();
    component.onDuePresetChange('NEXT_7');

    expect(component.dueFrom).toBe('2026-05-12');
    expect(component.dueTo).toBe('2026-05-19');

    vi.useRealTimers();
  });

  it('applies NEXT_30 due preset from today through day 30', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T09:45:00Z'));

    const { component } = createComponent();
    component.onDuePresetChange('NEXT_30');

    expect(component.dueFrom).toBe('2026-05-12');
    expect(component.dueTo).toBe('2026-06-11');

    vi.useRealTimers();
  });

  it('computes unread feedback from timestamp fallback when explicit flag is absent', () => {
    const { component } = createComponent();

    expect(component.isUnreadFeedback({
      homeworkId: 'h1',
      title: 'Item',
      dueDate: '2026-05-20',
      status: 'SUBMITTED',
      feedbackUpdatedAt: '2026-05-10T10:00:00Z',
      feedbackReadAt: '2026-05-09T10:00:00Z'
    })).toBe(true);

    expect(component.isUnreadFeedback({
      homeworkId: 'h2',
      title: 'Item',
      dueDate: '2026-05-20',
      status: 'SUBMITTED',
      feedbackUpdatedAt: '2026-05-10T10:00:00Z',
      feedbackReadAt: '2026-05-11T10:00:00Z'
    })).toBe(false);
  });

  it('notifies when trying to export csv with no filtered rows', () => {
    const { component, notificationMock } = createComponent();

    component.exportFilteredCsv();

    expect(notificationMock.info).toHaveBeenCalledWith('No rows to export');
  });

  it('exports only filtered rows and escapes csv values', async () => {
    const { component } = createComponent();
    component.rows = [
      {
        homeworkId: 'h1',
        title: 'Math "Quiz"',
        dueDate: '2026-05-20',
        classId: 'C-1',
        teacherName: 'Teacher One',
        status: 'SUBMITTED',
        submittedAt: '2026-05-19',
        grade: 95,
        unreadFeedback: true
      },
      {
        homeworkId: 'h2',
        title: 'Science Report',
        dueDate: '2026-05-21',
        className: 'Class B',
        teacherName: 'Teacher Two',
        status: 'LATE',
        unreadFeedback: false
      }
    ];
    component.searchTitle = 'math';

    const originalCreateElement = document.createElement.bind(document);
    const anchor = originalCreateElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag.toLowerCase() === 'a') {
        return anchor;
      }
      return originalCreateElement(tag);
    }) as any);
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv-test');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    component.exportFilteredCsv();

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect((anchor as HTMLAnchorElement).download).toBe('guardian_homework_filtered.csv');
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:csv-test');

    const exportedBlob = createObjectUrlSpy.mock.calls[0][0] as Blob;
    const csv = await exportedBlob.text();

    expect(csv).toContain('Title,Class,Teacher,DueDate,Status,SubmittedAt,Grade,UnreadFeedback');
    expect(csv).toContain('"Math ""Quiz""","C-1","Teacher One","2026-05-20","SUBMITTED","2026-05-19","95","YES"');
    expect(csv).not.toContain('Science Report');

    createElementSpy.mockRestore();
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('declares feedback column and unread indicator bindings in template', () => {
    const source = readFileSync(
      join(process.cwd(), 'src', 'app', 'features', 'guardian', 'homework', 'guardian-homework.component.ts'),
      'utf-8'
    );

    expect(source).toContain('<th style="width: 110px">Feedback</th>');
    expect(source).toContain('*ngIf="isUnreadFeedback(row)" class="pi pi-circle-fill unread-dot"');
    expect(source).toContain('*ngIf="!isUnreadFeedback(row)">-</span>');
  });
});

