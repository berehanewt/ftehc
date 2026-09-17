import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { GuardianLinksComponent } from './guardian-links.component';
import { GuardianLinksAdminService } from './guardian-links-admin.service';

function createComponent(): GuardianLinksComponent {
  const guardianLinksServiceMock: Partial<GuardianLinksAdminService> = {
    listGuardians: () => of([]),
    listStudents: () => of([]),
    listGuardianLinks: () => of([]),
    linkGuardian: () => of({ id: 'g1', studentIds: [] }),
    unlinkGuardian: () => of({ id: 'g1', studentIds: [] })
  };

  return new GuardianLinksComponent(
    new FormBuilder(),
    guardianLinksServiceMock as GuardianLinksAdminService
  );
}

describe('GuardianLinksComponent filtering', () => {
  it('keeps student options empty until guardian is selected', () => {
    const component = createComponent();
    component.allStudentOptions = [
      { label: 'Student One', value: 's1' }
    ];

    (component as any).updateStudentOptions();

    expect(component.studentOptions).toEqual([]);
  });

  it('excludes already linked students for selected guardian', () => {
    const component = createComponent();
    component.allStudentOptions = [
      { label: 'Student One', value: 's1' },
      { label: 'Student Two', value: 's2' }
    ];
    component.guardianLinks = [
      { id: 'g1', studentIds: ['s1'] }
    ];

    component.linkForm.patchValue({ guardianId: 'g1' });
    (component as any).updateStudentOptions();

    expect(component.studentOptions.map(o => o.value)).toEqual(['s2']);
  });

  it('clears selected student when selected guardian options no longer include it', () => {
    const component = createComponent();
    component.allStudentOptions = [
      { label: 'Student One', value: 's1' },
      { label: 'Student Two', value: 's2' }
    ];
    component.guardianLinks = [
      { id: 'g1', studentIds: ['s1'] }
    ];

    component.linkForm.patchValue({ guardianId: 'g1', studentId: 's1' });
    (component as any).updateStudentOptions();

    expect(component.linkForm.controls.studentId.value).toBeNull();
  });
});

