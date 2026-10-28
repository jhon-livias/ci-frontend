import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { PaymentsAdminService } from '../../data-access/payments-admin.service';
import { AuditLogService } from '../../data-access/audit-log.service';
import { ModuleCatalogService } from '../../data-access/module-catalog.service';
import { UserDirectoryService } from '../../data-access/user-directory.service';
import { AdminHomeDashboardComponent } from './admin-home-dashboard.component';

describe('AdminHomeDashboardComponent', () => {
  const listUsers = vi.fn();
  const listModules = vi.fn();
  const listAudit = vi.fn();

  beforeEach(() => {
    listUsers.mockReset();
    listModules.mockReset();
    listAudit.mockReset();
    listUsers.mockResolvedValue({ total: 8 });
    listModules.mockResolvedValue({
      modules: [
        { code: 'STUDENT', name: 'Alumnos', users: 5, active: 4, inactive: 1 },
        { code: 'TEACHER', name: 'Docente', users: 2, active: 2, inactive: 0 },
        { code: 'ADVISOR', name: 'Asesora', users: 0, active: 0, inactive: 0 },
        { code: 'DIRECTOR', name: 'Director', users: 1, active: 1, inactive: 0 },
        { code: 'ADMINISTRATOR', name: 'Administrador', users: 1, active: 1, inactive: 0 },
      ],
    });
    listAudit.mockResolvedValue({
      events: [{
        id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a01',
        occurredAt: '2026-10-28T14:00:00.000Z',
        actorName: 'Administrador UPRIT',
        actorRole: 'Administrador',
        module: 'Usuarios',
        action: 'Creó la cuenta de Ada Lima.',
      }],
    });
    TestBed.configureTestingModule({
      imports: [AdminHomeDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: UserDirectoryService, useValue: { list: listUsers } },
        { provide: ModuleCatalogService, useValue: { list: listModules } },
        { provide: AuditLogService, useValue: { list: listAudit } },
        { provide: PaymentsAdminService, useValue: { read: async () => ({ pendingIncidents: 0 }) } },
      ],
    });
  });

  it('shows active accounts, role bars and the latest movement', async () => {
    const fixture = TestBed.createComponent(AdminHomeDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Usuarios activos');
    expect(text).toContain('8');
    expect(text).toContain('Grupos aperturados');
    expect(text).toContain('Matrículas del mes');
    expect(text).toContain('Incidencias de pago');
    expect(text).toContain('Estudiante');
    expect(text).toContain('4');
    expect(text).toContain('Creó la cuenta de Ada Lima.');
    expect(text).toContain('Ver historial');
    expect(listUsers).toHaveBeenCalledWith({ status: 'ACTIVE', page: 1, pageSize: 5 });
  });
});
