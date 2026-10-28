import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FollowUpService } from '../../data-access/follow-up.service';
import { StudentAttendanceComponent } from './student-attendance.component';

describe('StudentAttendanceComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudentAttendanceComponent],
      providers: [{ provide: FollowUpService, useValue: { read: vi.fn().mockResolvedValue({ absenceLimit: 30, students: [], alerts: [], teachers: [], absences: [] }) } }],
    });
  });

  it('shows the semaphore and an empty consultation', async () => {
    const fixture = TestBed.createComponent(StudentAttendanceComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Asistencias y notas de alumnos');
    expect(text).toContain('30 %');
    expect(text).toContain('Aún no hay asistencias de alumnos.');
  });
});
