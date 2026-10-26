import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AccessPolicyService } from './access-policy.service';

describe('AccessPolicyService', () => {
  let service: AccessPolicyService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AccessPolicyService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adapts a valid policy from the trusted API', async () => {
    const result = service.read();
    http.expectOne('/api/v1/auth/access-policy').flush({
      roles: [{ code: 'ADMINISTRATOR', name: 'Administrador', description: 'Supervisión', permissions: ['access_policy.read'] }],
      permissions: [{ code: 'access_policy.read', description: 'Consultar política' }],
    });
    expect((await result).roles[0].name).toBe('Administrador');
  });

  it('rejects malformed responses', async () => {
    const result = service.read();
    http.expectOne('/api/v1/auth/access-policy').flush({ roles: [{ code: 4 }], permissions: [] });
    await expect(result).rejects.toThrow();
  });
});
