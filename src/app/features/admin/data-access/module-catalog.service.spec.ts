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

  it('loads the directory page from the gateway', async () => {
    const result = service.list({ page: 1, pageSize: 5 });
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/auth/admin/modules');
    request.flush({
      page: 1,
      pageSize: 5,
      total: 1,
      modules: [{ code: 'TEACHER', name: 'Docente', users: 3, active: 2, inactive: 1 }],
    });
    expect((await result).modules[0]?.name).toBe('Docente');
    expect(request.request.params.get('page')).toBe('1');
  });

  it('rejects a count that does not add up', async () => {
    const result = service.list({ page: 1, pageSize: 5 });
    http.expectOne((candidate) => candidate.url === '/api/v1/auth/admin/modules').flush({
      page: 1,
      pageSize: 5,
      total: 1,
      modules: [{ code: 'TEACHER', name: 'Docente', users: 9, active: 2, inactive: 1 }],
    });
    await expect(result).rejects.toThrow();
  });
});
