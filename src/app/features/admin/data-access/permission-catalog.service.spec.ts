import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PermissionCatalogService } from './permission-catalog.service';

describe('PermissionCatalogService', () => {
  let service: PermissionCatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PermissionCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('accepts a catalog page and rejects a malformed one', async () => {
    const result = service.list({ module: 'registro-academico', page: 1, pageSize: 5 });
    http.expectOne((request) => request.url === '/api/v1/auth/admin/permissions' && request.params.get('module') === 'registro-academico' && request.params.get('page') === '1').flush({
      modules: [{ code: 'registro-academico', name: 'Registro Académico' }],
      page: 1,
      pageSize: 5,
      total: 1,
      items: [{ id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d4e01', moduleCode: 'registro-academico', name: 'Control total', enabled: true, functionalities: [{ name: 'Total', enabled: true }] }],
    });
    expect((await result).items[0]?.name).toBe('Control total');

    const invalid = service.list({ page: 1, pageSize: 5 });
    http.expectOne((request) => request.url === '/api/v1/auth/admin/permissions' && request.params.get('page') === '1').flush({ items: [{ name: '<b>' }] });
    await expect(invalid).rejects.toThrow();
  });
});
