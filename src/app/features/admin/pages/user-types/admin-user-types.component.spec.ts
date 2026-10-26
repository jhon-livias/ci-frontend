import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { UserTypeCatalogService, type UserTypePage } from '../../data-access/user-type-catalog.service';
import { AdminUserTypesComponent } from './admin-user-types.component';

const permissionId = '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a10';

const page = (items: UserTypePage['items']): UserTypePage => ({
  modules: [{ code: 'estudiante', name: 'Estudiante' }],
  catalog: [{ id: permissionId, name: 'Registrar matrícula' }],
  page: 1,
  pageSize: 5,
  total: items.length,
  items,
});

describe('AdminUserTypesComponent', () => {
  const list = vi.fn();
  const create = vi.fn();
  const remove = vi.fn();

  beforeEach(() => {
    list.mockReset();
    create.mockReset();
    remove.mockReset();
    create.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
    list.mockResolvedValue(page([
      {
        id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a01',
        name: 'Estudiante',
        moduleCode: 'estudiante',
        moduleName: 'Estudiante',
        enabled: true,
        permissions: ['Registrar matrícula', 'Historial académico'],
        access: [{ code: 'estudiante', name: 'Estudiante', enabled: true }],
      },
    ]));
    TestBed.configureTestingModule({
      imports: [AdminUserTypesComponent],
      providers: [{ provide: UserTypeCatalogService, useValue: { list, update: vi.fn(), remove, create } }],
    });
  });

  it('shows the user types returned by the catalog', async () => {
    const fixture = TestBed.createComponent(AdminUserTypesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('TIPOS DE USUARIOS');
    expect(text).toContain('Estudiante');
    expect(text).toContain('Registrar matrícula - Historial académico');
    expect(text).toContain('1-1 de 1');
    expect(text).toContain('Items por pagina:');
  });

  it('creates a user type with the modules that stay on', async () => {
    const fixture = TestBed.createComponent(AdminUserTypesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;
    name.value = 'Registrador';
    name.dispatchEvent(new Event('input'));
    (fixture.nativeElement.querySelector('[aria-label="Registrar matrícula"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const save = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.trim() === 'Guardar') as HTMLButtonElement;
    save.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm__accept') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(create).toHaveBeenCalledWith({ name: 'Registrador', permissions: [{ id: permissionId, enabled: true }] });
  });

  it('returns to the list from the editor', async () => {
    const fixture = TestBed.createComponent(AdminUserTypesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const back = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.trim() === 'Volver') as HTMLButtonElement;
    back.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Agregar');
    expect(fixture.nativeElement.textContent).not.toContain('Módulos con acceso');
  });

  it('deletes a user type after confirmation', async () => {
    const fixture = TestBed.createComponent(AdminUserTypesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Eliminar Estudiante"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm__accept') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(remove).toHaveBeenCalledWith('6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a01');
  });
});
