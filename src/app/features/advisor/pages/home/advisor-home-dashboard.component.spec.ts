import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { FollowUpService } from '../../../follow-up/data-access/follow-up.service';
import { AdvisorHomeDashboardComponent } from './advisor-home-dashboard.component';

describe('AdvisorHomeDashboardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdvisorHomeDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: FollowUpService, useValue: { read: vi.fn().mockResolvedValue({ alerts: [], students: [], teachers: [], absences: [], absenceLimit: 30 }) } },
      ],
    });
  });

  it('shows an empty attendance watch list', async () => {
    const fixture = TestBed.createComponent(AdvisorHomeDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Alertas de asistencia');
    expect(text).toContain('Aún no hay alumnos cerca del límite de inasistencia.');
    expect(text).toContain('Ver asistencias');
  });
});
