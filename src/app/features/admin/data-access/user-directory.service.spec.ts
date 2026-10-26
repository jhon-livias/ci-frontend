import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UserDirectoryService } from './user-directory.service';

const userId = '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a01';

describe('UserDirectoryService', () => {
  let service: UserDirectoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UserDirectoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a page from the API', async () => {
    const result = service.list({ page: 1, pageSize: 5, search: 'Carlos' });
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/auth/admin/users');
    expect(request.request.params.get('search')).toBe('Carlos');
    expect(request.request.params.get('pageSize')).toBe('5');
    request.flush({
      page: 1,
      pageSize: 5,
      total: 1,
      types: [{ code: 'STUDENT', name: 'Estudiante' }],
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
    expect((await result).users[0].documentNumber).toBe('123456');
  });

  it('rejects malformed user data', async () => {
    const result = service.list({ page: 1, pageSize: 5 });
    http.expectOne((candidate) => candidate.url === '/api/v1/auth/admin/users').flush({ page: 1, pageSize: 5, total: 0, types: [], statuses: [], users: [{ documentNumber: 1 }] });
    await expect(result).rejects.toThrow();
  });
});
