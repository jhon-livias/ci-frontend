import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PermissionCatalogService, type PermissionPage } from '../../data-access/permission-catalog.service';
import { AdminPermissionsComponent } from './admin-permissions.component';

const page = (items: PermissionPage['items']): PermissionPage => ({
  modules: [{ code: 'registro-academico', name: 'Registro Académico' }],
  page: 1,
  pageSize: 5,
  total: items.length,
  items,
});

describe('AdminPermissionsComponent', () => {
  const list = vi.fn();
  const update = vi.fn();

  beforeEach(() => {
    list.mockReset();
    update.mockReset();
    update.mockResolvedValue(undefined);
    list.mockResolvedValue(page([
      { id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d4e01', moduleCode: 'registro-academico', name: 'Control total', enabled: true, functionalities: [{ name: 'Total', enabled: true }] },
      { id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d4e02', moduleCode: 'registro-academico', name: 'Registro Programas', enabled: true, functionalities: [{ name: 'Funcionalidad 1', enabled: true }, { name: 'Funcionalidad 2', enabled: true }] },
    ]));
    TestBed.configureTestingModule({
      imports: [AdminPermissionsComponent],
      providers: [{ provide: PermissionCatalogService, useValue: { list, update, remove: vi.fn(), create: vi.fn() } }],
    });
  });

  const setup = async () => {
    const fixture = TestBed.createComponent(AdminPermissionsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  it('shows the permissions returned by the catalog', async () => {
    const fixture = await setup();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Inicio / Permisos');
    expect(text).toContain('Permisos');
    expect(text).toContain('Buscar permiso');
    expect(text).toContain('Control total');
    expect(text).toContain('Registro Programas');
    expect(text).toContain('Funcionalidad 1 - Funcionalidad 2');
    expect(text).toContain('1-2 de 2');
    expect(text).toContain('Elementos por página:');
  });

  it('asks the catalog again when the search changes', async () => {
    list.mockResolvedValueOnce(page([
      { id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d4e01', moduleCode: 'registro-academico', name: 'Control total', enabled: true, functionalities: [{ name: 'Total', enabled: true }] },
      { id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d4e02', moduleCode: 'registro-academico', name: 'Registro Programas', enabled: true, functionalities: [{ name: 'Funcionalidad 1', enabled: true }, { name: 'Funcionalidad 2', enabled: true }] },
    ]));
    list.mockResolvedValueOnce(page([
      { id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d4e02', moduleCode: 'registro-academico', name: 'Registro Programas', enabled: true, functionalities: [{ name: 'Funcionalidad 1', enabled: true }, { name: 'Funcionalidad 2', enabled: true }] },
    ]));
    const fixture = await setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]');
    input.value = 'programa';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('tbody').textContent as string;

    expect(list).toHaveBeenLastCalledWith({ module: 'estudiante', search: 'programa', page: 1, pageSize: 5 });
    expect(body).toContain('Registro Programas');
    expect(body).not.toContain('Control total');
  });

  it('saves an edited permission through the catalog', async () => {
    const fixture = await setup();
    (fixture.nativeElement.querySelector('[aria-label="Editar Control total"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Todo"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const save = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.trim() === 'Guardar') as HTMLButtonElement;
    save.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm__accept') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith('6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d4e01', {
      functionalities: [{ name: 'Total', enabled: false }],
    });
  });
});
