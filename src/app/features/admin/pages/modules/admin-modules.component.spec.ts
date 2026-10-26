import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ModuleCatalogService, type ModulePage } from '../../data-access/module-catalog.service';
import { AdminModulesComponent } from './admin-modules.component';

const page = (): ModulePage => ({
  page: 1,
  pageSize: 5,
  total: 2,
  modules: [
    { code: 'TEACHER', name: 'Docente', users: 197, active: 132, inactive: 65 },
    { code: 'STUDENT', name: 'Alumnos', users: 3679, active: 3645, inactive: 34 },
  ],
});

describe('AdminModulesComponent', () => {
  const list = vi.fn();

  beforeEach(() => {
    list.mockReset();
    list.mockResolvedValue(page());
    TestBed.configureTestingModule({
      imports: [AdminModulesComponent],
      providers: [{ provide: ModuleCatalogService, useValue: { list } }],
    });
  });

  it('shows the module counts from the directory', async () => {
    const fixture = TestBed.createComponent(AdminModulesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('MÓDULOS');
    expect(text).toContain('Docente');
    expect(text).toContain('197');
    expect(text).toContain('132');
    expect(text).toContain('65');
    expect(text).toContain('Alumnos');
    expect(text).toContain('3679');
    expect(text).toContain('Items por pagina:');
    expect(text).toContain('1-2 de 2');
  });

  it('asks for modules that already have users', async () => {
    const fixture = TestBed.createComponent(AdminModulesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Filtrar módulos con usuarios"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ occupied: true, page: 1, pageSize: 5 }));
  });
});
