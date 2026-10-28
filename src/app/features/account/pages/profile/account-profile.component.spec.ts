import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { SitesService } from '../../../admin/data-access/sites.service';
import { AccountProfileService } from '../../data-access/account-profile.service';
import { AccountProfileComponent } from './account-profile.component';

const profile = {
  firstName: 'Juan Miguel',
  paternalLastName: 'Pérez',
  maternalLastName: 'Arbeloa',
  documentType: 'DNI',
  documentNumber: '12345678',
  gender: '',
  birthDate: '',
  maritalStatus: '',
  mobileCountry: '+51',
  mobile: '',
  personalEmail: '',
  email: 'juan@uprit.edu.pe',
  address: '',
  siteId: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a01',
  typeName: 'Administrador',
  statusName: 'Habilitado',
  username: '12345678',
};

describe('AccountProfileComponent', () => {
  let fixture: ComponentFixture<AccountProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountProfileComponent],
      providers: [
        { provide: AccountProfileService, useValue: { get: async () => profile, update: async () => profile, message: () => 'No se pudo actualizar el perfil.' } },
        { provide: SitesService, useValue: { list: async () => [{ id: profile.siteId, name: 'Trujillo' }] } },
        { provide: AuthApiService, useValue: { changePassword: async () => undefined } },
        { provide: AuthSessionService, useValue: { user: signal({ displayName: 'Juan Miguel Pérez' }), passwordChanged() {} } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();
    await (fixture.componentInstance as unknown as { load(): Promise<void> }).load();
    fixture.detectChanges();
  });

  it('opens the student data view and leaves out the photo tab', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Perfil académico');
    expect(text).toContain('Juan Miguel, Pérez Arbeloa');
    expect(text).toContain('Datos del alumno');
    expect(text).toContain('Datos académicos');
    expect(text).toContain('Configuración');
    expect(text).not.toContain('Foto');
    expect(text).toContain('12345678');
    expect(text).toContain('juan@uprit.edu.pe');
  });

  it('shows the academic assignment and the password form', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Datos académicos'))?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Trujillo');
    expect(fixture.nativeElement.textContent).toContain('Administrador');

    buttons.find((button) => button.textContent?.includes('Configuración'))?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nueva contraseña');
  });
});
