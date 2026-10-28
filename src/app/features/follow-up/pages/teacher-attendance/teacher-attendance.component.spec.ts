import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FollowUpService } from '../../data-access/follow-up.service';
import { TeacherAttendanceComponent } from './teacher-attendance.component';

describe('TeacherAttendanceComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TeacherAttendanceComponent],
      providers: [{ provide: FollowUpService, useValue: { read: vi.fn().mockResolvedValue({ teachers: [], students: [], alerts: [], absences: [], absenceLimit: 30 }) } }],
    });
  });

  it('shows an empty teacher consultation', async () => {
    const fixture = TestBed.createComponent(TeacherAttendanceComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay asistencias de docentes.');
  });
});
