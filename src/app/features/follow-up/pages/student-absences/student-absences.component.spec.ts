import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FollowUpService } from '../../data-access/follow-up.service';
import { StudentAbsencesComponent } from './student-absences.component';

describe('StudentAbsencesComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudentAbsencesComponent],
      providers: [{ provide: FollowUpService, useValue: { read: vi.fn().mockResolvedValue({ absences: [], students: [], teachers: [], alerts: [], absenceLimit: 30 }) } }],
    });
  });

  it('is consultation only and starts empty', async () => {
    const fixture = TestBed.createComponent(StudentAbsencesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('no permite justificarlas');
    expect(text).toContain('Aún no hay faltas registradas.');
  });
});
