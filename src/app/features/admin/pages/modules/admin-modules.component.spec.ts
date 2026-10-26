import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { ModuleCatalogService } from '../../data-access/module-catalog.service';
import { AdminModulesComponent } from './admin-modules.component';

describe('AdminModulesComponent', () => {
  const list = vi.fn();
  beforeEach(() => {
    list.mockReset();
    TestBed.configureTestingModule({
      imports: [AdminModulesComponent],
      providers: [provideRouter([]), { provide: ModuleCatalogService, useValue: { list } }],
    });
  });

  it('filters modules by their name', async () => {
    list.mockResolvedValue([
      { code: 'users', name: 'Usuarios', description: 'Cuentas', status: 'IN_PROGRESS' },
      { code: 'sites', name: 'Sedes', description: 'Trujillo', status: 'PLANNED' },
    ]);
    const fixture = TestBed.createComponent(AdminModulesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input#module-search');
    input.value = 'sede';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    const tableBody = fixture.nativeElement.querySelector('tbody');
    expect(tableBody.textContent).toContain('Sedes');
    expect(tableBody.textContent).not.toContain('Usuarios');
    expect(fixture.nativeElement.textContent).toContain('1 de 2 módulos');
  });

  it('shows a controlled error when the catalog cannot be loaded', async () => {
    list.mockRejectedValue(new Error('offline'));
    const fixture = TestBed.createComponent(AdminModulesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar');
  });
});
