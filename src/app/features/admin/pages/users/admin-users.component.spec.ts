import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PermissionCatalogService } from '../../data-access/permission-catalog.service';
import { SitesService } from '../../data-access/sites.service';
import { UserDirectoryService, type UserPage } from '../../data-access/user-directory.service';
import { AdminUsersComponent } from './admin-users.component';

const userId = '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a01';
const siteId = '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a02';

const page = (): UserPage => ({
  page: 1,
  pageSize: 5,
  total: 1,
  types: [
    { code: 'STUDENT', name: 'Estudiante' },
    { code: 'TEACHER', name: 'Docente' },
    { code: 'ADVISOR', name: 'Asesora' },
    { code: 'DIRECTOR', name: 'Director' },
    { code: 'ADMINISTRATOR', name: 'Administrador' },
  ],
  statuses: [{ code: 'ACTIVE', name: 'Activo' }],
  users: [{
    id: userId,
    documentNumber: '123456',
    firstName: 'Carlos',
    paternalLastName: 'Haro',
    maternalLastName: 'Polo',
    typeName: 'Estudiante',
    roles: ['STUDENT'],
  }],
});

describe('AdminUsersComponent', () => {
  const list = vi.fn();
  const get = vi.fn();
  const update = vi.fn();
  const resetPassword = vi.fn();
  const requirePasswordChange = vi.fn();
  const remove = vi.fn();

  beforeEach(() => {
    list.mockReset();
    get.mockReset();
    update.mockReset();
    resetPassword.mockReset();
    requirePasswordChange.mockReset();
    remove.mockReset();
    list.mockResolvedValue(page());
    get.mockResolvedValue({
      id: userId,
      documentType: 'DNI',
      documentNumber: '00000000',
      firstName: 'Carlos',
      paternalLastName: 'Haro',
      maternalLastName: 'Polo',
      siteId,
      phone: '',
      mobileCountry: '+51',
      mobile: '946869590',
      email: 'admin@uprit.edu.pe',
      enabled: true,
      grants: [{ permissionId: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d4a01', name: 'Seleccionar idioma', enabled: true }],
    });
    update.mockResolvedValue(undefined);
    resetPassword.mockResolvedValue({ username: '123456', password: 'X7f@93L.p' });
    requirePasswordChange.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
      providers: [
        { provide: UserDirectoryService, useValue: { list, get, create: vi.fn(), update, resetPassword, requirePasswordChange, remove } },
        { provide: PermissionCatalogService, useValue: { list: vi.fn().mockResolvedValue({
          modules: [],
          page: 1,
          pageSize: 20,
          total: 1,
          items: [{ id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d4a01', moduleCode: 'estudiante', name: 'Registrar matrícula', enabled: true, functionalities: [{ name: 'Seleccionar idioma', enabled: true }] }],
        }) } },
        { provide: SitesService, useValue: { list: vi.fn().mockResolvedValue([{ id: siteId, code: 'TRUJILLO', name: 'Trujillo', location: null, active: true, districtCode: null }]) } },
      ],
    });
  });

  it('shows the directory returned by the API', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Inicio / Usuarios');
    expect(text).toContain('Usuarios');
    expect(text).toContain('Buscar usuario');
    expect(text).toContain('Módulo');
    expect(text).toContain('123456');
    expect(text).toContain('Carlos');
    expect(text).toContain('Haro');
    expect(text).toContain('Polo');
    expect(text).toContain('Estudiante');
    expect(text).toContain('Tipo (5)');
    expect(text).toContain('1-1 de 1');
    expect(text).toContain('Elementos por página:');
  });

  it('filters by role', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#user-filter-type [role="combobox"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    const option = [...fixture.nativeElement.querySelectorAll('[role="option"]')].find((item) => (item as HTMLElement).textContent?.trim() === 'Estudiante') as HTMLButtonElement;
    option.click();
    await fixture.whenStable();

    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'STUDENT', page: 1, pageSize: 5 }));
  });

  it('opens the user wizard from Agregar', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('NUEVO USUARIO');
    expect(text).toContain('Editar Datos');
    expect(text).toContain('Editar Permisos');
    const back = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.trim() === 'Volver') as HTMLButtonElement;
    back.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Agregar');
    expect(fixture.nativeElement.textContent).not.toContain('NUEVO USUARIO');
  });

  it('shows the temporary password once and stores the next-login choice', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Restablecer clave de Carlos"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(resetPassword).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('¿Estás seguro que deseas restablecer la contraseña de este usuario?');
    expect(fixture.nativeElement.textContent).toContain('Carlos Haro Polo');
    (fixture.nativeElement.querySelector('.confirm__accept') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(resetPassword).toHaveBeenCalledWith(userId);
    expect(text).toContain('CONTRASEÑA RESTABLECIDA');
    expect(text).toContain('123456');
    expect(text).toContain('X7f@93L.p');
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    const accept = [...fixture.nativeElement.querySelectorAll('button')].find((button) => button.textContent?.includes('Aceptar')) as HTMLButtonElement;
    accept.click();
    await fixture.whenStable();

    expect(requirePasswordChange).toHaveBeenCalledWith(userId, true);
  });

  it('saves the account before opening permissions when editing', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Editar Carlos"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const next = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.trim() === 'Siguiente') as HTMLButtonElement;
    next.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(update).toHaveBeenCalledWith(userId, expect.objectContaining({ firstName: 'Carlos', documentNumber: '00000000', email: 'admin@uprit.edu.pe' }));
    expect(fixture.nativeElement.textContent).toContain('PERMISOS');
    expect(fixture.nativeElement.textContent).toContain('Datos guardados.');
  });

  it('saves an incomplete edit without waiting for another confirmation', async () => {
    get.mockResolvedValue({
      id: userId,
      documentType: 'DNI',
      documentNumber: '00000000',
      firstName: 'Carlos',
      paternalLastName: 'Haro',
      maternalLastName: '',
      siteId: '',
      phone: '',
      mobileCountry: '+51',
      mobile: '',
      email: 'admin@uprit.edu.pe',
      enabled: true,
      grants: [],
    });
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Editar Carlos"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const save = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.trim() === 'Guardar') as HTMLButtonElement;
    save.click();
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith(userId, expect.objectContaining({
      firstName: 'Carlos',
      maternalLastName: '',
      siteId: '',
      mobile: '',
      grants: [],
    }));
  });

  it('calls the directory when Guardar is clicked', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Editar Carlos"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    const save = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.trim() === 'Guardar') as HTMLButtonElement;
    save.click();
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith(userId, expect.objectContaining({ firstName: 'Carlos', siteId, email: 'admin@uprit.edu.pe' }));
  });

  it('deletes a user after confirmation', async () => {
    remove.mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Eliminar Carlos"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('¿Estás seguro que deseas eliminar este usuario?');
    (fixture.nativeElement.querySelector('.confirm__accept') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(remove).toHaveBeenCalledWith(userId);
  });
});
