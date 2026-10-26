import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ModuleCatalogService } from './module-catalog.service';

describe('ModuleCatalogService', () => {
  let service: ModuleCatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ModuleCatalogService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads the catalog from the gateway', async () => {
    const result = service.list();
    http.expectOne('/api/v1/auth/admin/modules').flush({ modules: [
      { code: 'users', name: 'Usuarios', description: 'Cuentas', status: 'IN_PROGRESS' },
    ] });
    expect((await result)[0].name).toBe('Usuarios');
  });

  it('rejects invalid statuses and malformed data', async () => {
    const result = service.list();
    http.expectOne('/api/v1/auth/admin/modules').flush({ modules: [
      { code: 'users', name: 'Usuarios', description: 'Cuentas', status: 'INVALID' },
    ] });
    await expect(result).rejects.toThrow();
  });

  it('rejects duplicate module codes', async () => {
    const result = service.list();
    const module = { code: 'users', name: 'Usuarios', description: 'Cuentas', status: 'PLANNED' };
    http.expectOne('/api/v1/auth/admin/modules').flush({ modules: [module, module] });
    await expect(result).rejects.toThrow();
  });
});
