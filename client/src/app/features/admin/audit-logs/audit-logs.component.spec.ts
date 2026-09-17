import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuditLogsComponent } from './audit-logs.component';
import { AuditLogsAdminService } from './audit-logs-admin.service';

function createComponent(actionQueryParam: string | null) {
  const auditLogsServiceMock = {
    queryLogs: vi.fn(() => of([]))
  };

  const routeMock = {
    snapshot: {
      queryParamMap: {
        get: (key: string) => (key === 'action' ? actionQueryParam : null)
      }
    }
  };

  const component = new AuditLogsComponent(
    new FormBuilder(),
    auditLogsServiceMock as unknown as AuditLogsAdminService,
    routeMock as any
  );

  return { component, auditLogsServiceMock };
}

describe('AuditLogsComponent', () => {
  it('prefills action filter from query params on init', () => {
    const { component, auditLogsServiceMock } = createComponent('USER_DELETE');

    component.ngOnInit();

    expect(component.filterForm.controls.action.value).toBe('USER_DELETE');
    expect(auditLogsServiceMock.queryLogs).toHaveBeenCalledWith({
      userId: undefined,
      action: 'USER_DELETE',
      from: undefined,
      to: undefined,
      limit: 200
    });
  });

  it('loads logs without action filter when query param is missing', () => {
    const { component, auditLogsServiceMock } = createComponent(null);

    component.ngOnInit();

    expect(component.filterForm.controls.action.value).toBe('');
    expect(auditLogsServiceMock.queryLogs).toHaveBeenCalledWith({
      userId: undefined,
      action: undefined,
      from: undefined,
      to: undefined,
      limit: 200
    });
  });
});

