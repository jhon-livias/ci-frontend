import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthSessionService } from './core/auth/auth-session.service';
import { AdministratorHomeComponent } from './features/admin/pages/administrator-home/administrator-home.component';
import { HomePageComponent } from './features/home/pages/home-page.component';
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
});
