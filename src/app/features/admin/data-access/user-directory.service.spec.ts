import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UserDirectoryService } from './user-directory.service';

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
    const result = service.list(1);
    http.expectOne('/api/v1/auth/admin/users?page=1').flush({ page: 1, hasMore: false, users: [
      { id: '1', username: 'admin', displayName: 'Ada Lima', status: 'ACTIVE', roles: ['ADMINISTRATOR'] },
    ] });
    expect((await result).users[0].username).toBe('admin');
  });

  it('rejects malformed user data', async () => {
    const result = service.list(1);
    http.expectOne('/api/v1/auth/admin/users?page=1').flush({ page: 1, hasMore: false, users: [{ username: 1 }] });
    await expect(result).rejects.toThrow();
  });
});
