import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthSessionService } from './core/auth/auth-session.service';
import { AdministratorHomeComponent } from './features/admin/pages/administrator-home/administrator-home.component';
import { AdvisorHomeComponent } from './features/advisor/pages/advisor-home/advisor-home.component';
import { DirectorHomeComponent } from './features/director/pages/director-home/director-home.component';
import { DirectorOperationsService } from './features/director/data-access/director-operations.service';
import { DirectorTeachersService } from './features/director/data-access/director-teachers.service';
import { FollowUpService } from './features/follow-up/data-access/follow-up.service';
import { HomePageComponent } from './features/home/pages/home-page.component';
import { AuditLogService } from './features/admin/data-access/audit-log.service';
import { ModuleCatalogService } from './features/admin/data-access/module-catalog.service';
import { PaymentsAdminService } from './features/admin/data-access/payments-admin.service';
import { UserDirectoryService } from './features/admin/data-access/user-directory.service';
import { routes } from './app.routes';

describe('application routes', () => {
  const authenticated = signal(true);
  const administrator = signal(true);
  const advisor = signal(false);
  const director = signal(false);
  const session = {
    isAuthenticated: authenticated,
    hasRole: (role: string) =>
      (role === 'ADMINISTRATOR' && administrator()) || (role === 'ADVISOR' && advisor()) || (role === 'DIRECTOR' && director()),
    defaultRoute: () => (authenticated() ? '/inicio' : '/login'),
    user: signal(null),
    csrfToken: signal(null),
    logout: async () => undefined,
  };

  beforeEach(async () => {
    authenticated.set(true);
    administrator.set(true);
    advisor.set(false);
    director.set(false);
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter(routes),
        { provide: AuthSessionService, useValue: session },
        { provide: UserDirectoryService, useValue: { list: async () => ({ total: 0 }) } },
        { provide: AuditLogService, useValue: { list: async () => ({ events: [] }) } },
        { provide: PaymentsAdminService, useValue: { read: async () => ({ tariffs: [], incidents: [], pendingIncidents: 0 }) } },
        { provide: FollowUpService, useValue: { read: async () => ({ absenceLimit: 30, alerts: [], students: [], teachers: [], absences: [] }) } },
        { provide: DirectorTeachersService, useValue: { list: async () => [] } },
        { provide: DirectorOperationsService, useValue: { groups: async () => [], catalogs: async () => [], schedules: async () => [] } },
        {
          provide: ModuleCatalogService,
          useValue: {
            list: async () => ({
              page: 1,
              pageSize: 5,
              total: 1,
              modules: [{ code: 'ADMINISTRATOR', name: 'Roles y permisos', users: 1, active: 1, inactive: 0 }],
            }),
          },
        },
      ],
    }).compileComponents();
  });

  it('loads the administrative view at the shared start route only for administrators', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/inicio', AdministratorHomeComponent);

    expect(component).toBeInstanceOf(AdministratorHomeComponent);
  });

  it('loads the advisor portal at the shared start route', async () => {
    administrator.set(false);
    advisor.set(true);
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/inicio', AdvisorHomeComponent);

    expect(component).toBeInstanceOf(AdvisorHomeComponent);
  });

  it('loads the director portal at the shared start route', async () => {
    administrator.set(false);
    advisor.set(false);
    director.set(true);
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/inicio', DirectorHomeComponent);

    expect(component).toBeInstanceOf(DirectorHomeComponent);
  });

  it('loads the common welcome view at the same route for other roles', async () => {
    administrator.set(false);
    advisor.set(false);
    director.set(false);
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/inicio', HomePageComponent);

    expect(component).toBeInstanceOf(HomePageComponent);
  });

  it('shows the module catalog to administrators', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/administracion/modulos', AdministratorHomeComponent);
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('Módulos');
    expect(harness.routeNativeElement?.textContent).toContain('Roles y permisos');
  });

  it('does not allow a non-administrator to access the module catalog', async () => {
    administrator.set(false);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/administracion/modulos');

    expect(harness.routeNativeElement?.textContent).not.toContain('Módulos del sistema');
  });
});
