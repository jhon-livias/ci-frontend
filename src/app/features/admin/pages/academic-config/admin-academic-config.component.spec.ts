import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AcademicConfigService, type AcademicConfig } from '../../data-access/academic-config.service';
import { AdminAcademicConfigComponent } from './admin-academic-config.component';

const config = (): AcademicConfig => ({
  catalogs: [
    { kind: 'LANGUAGE', title: 'Idiomas', items: [{ id: 'a1000001-0000-4000-8000-000000000001', name: 'Inglés' }] },
    { kind: 'LEVEL', title: 'Niveles', items: [{ id: 'b1000001-0000-4000-8000-000000000001', name: 'Básico 1' }] },
    { kind: 'STUDY_TYPE', title: 'Tipos de estudio', items: [{ id: 'c1000001-0000-4000-8000-000000000001', name: 'Regular' }] },
    { kind: 'MODALITY', title: 'Modalidades', items: [{ id: 'd1000001-0000-4000-8000-000000000001', name: 'Virtual' }] },
    { kind: 'GROUP_TYPE', title: 'Tipo de grupo', items: [{ id: 'e1000001-0000-4000-8000-000000000001', name: 'Clases' }] },
  ],
  rules: { minStudents: 31, maxStudents: 50, absencePercent: 30, passingGrade: 60, evaluationsPerGroup: 5, maxScorePerEvaluation: 20 },
  schedules: [],
});

describe('AdminAcademicConfigComponent', () => {
  const read = vi.fn();
  const removeItem = vi.fn();

  beforeEach(() => {
    read.mockReset();
    removeItem.mockReset();
    read.mockResolvedValue(config());
    removeItem.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [AdminAcademicConfigComponent],
      providers: [{ provide: AcademicConfigService, useValue: { read, removeItem, addItem: vi.fn(), saveRules: vi.fn() } }],
    });
  });

  it('shows the language catalog and the empty schedule consultation', async () => {
    const fixture = TestBed.createComponent(AdminAcademicConfigComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('CONFIGURACIÓN ACADÉMICA');
    expect(text).toContain('Inglés');
    expect(text).toContain('Aún no hay combos horarios.');
    expect((fixture.nativeElement.querySelector('input#rule-min') as HTMLInputElement).value).toBe('31');
  });

  it('asks for confirmation before removing a catalog item', async () => {
    const fixture = TestBed.createComponent(AdminAcademicConfigComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Quitar Inglés"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm__accept') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(removeItem).toHaveBeenCalledWith('a1000001-0000-4000-8000-000000000001');
  });
});
