import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FollowUpService } from '../../data-access/follow-up.service';
import { StudentAbsencesComponent } from './student-absences.component';

describe('StudentAbsencesComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudentAbsencesComponent],
      providers: [{ provide: FollowUpService, useValue: { absences: vi.fn().mockResolvedValue([]), justify: vi.fn(), attachment: vi.fn() } }],
    });
  });

  it('allows managing justifications and starts empty', async () => {
    const fixture = TestBed.createComponent(StudentAbsencesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Consulta, sustenta y descarga los adjuntos');
    expect(text).toContain('Aún no hay faltas registradas.');
  });
});
