import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthSessionService } from './core/auth/auth-session.service';
import { AdministratorHomeComponent } from './features/admin/pages/administrator-home/administrator-home.component';
import { HomePageComponent } from './features/home/pages/home-page.component';
import { ModuleCatalogService } from './features/admin/data-access/module-catalog.service';
import { routes } from './app.routes';

describe('application routes', () => {
  const authenticated = signal(true);
  const administrator = signal(true);
  const session = {
    isAuthenticated: authenticated,
    hasRole: (role: string) => role === 'ADMINISTRATOR' && administrator(),
    defaultRoute: () => (authenticated() ? '/inicio' : '/login'),
    user: signal(null),
    csrfToken: signal(null),
  };

  beforeEach(async () => {
    authenticated.set(true);
    administrator.set(true);
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter(routes),
        { provide: AuthSessionService, useValue: session },
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

  it('loads the common welcome view at the same route for non-administrators', async () => {
    administrator.set(false);
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
