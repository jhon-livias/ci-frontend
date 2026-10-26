import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AUDIT_MODULES, AUDIT_ROLES, AuditLogService } from './audit-log.service';

const page = {
  page: 1,
  pageSize: 5,
  total: 1,
  roles: [...AUDIT_ROLES],
  modules: [...AUDIT_MODULES],
  events: [{
    id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a01',
    occurredAt: '2026-10-26T21:08:55.000Z',
    actorName: 'Administrador UPRIT',
    actorRole: 'Administrador',
    module: 'Sesión',
    action: 'Inició sesión.',
  }],
};

describe('AuditLogService', () => {
  let service: AuditLogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuditLogService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads the movement log from the gateway', async () => {
    const result = service.list({ page: 1, pageSize: 5 });
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/auth/admin/audit');
    request.flush(page);
    expect((await result).events[0]?.action).toBe('Inició sesión.');
    expect(request.request.params.get('pageSize')).toBe('5');
  });

  it('rejects an action that contains markup', async () => {
    const result = service.list({ page: 1, pageSize: 5 });
    http.expectOne((candidate) => candidate.url === '/api/v1/auth/admin/audit').flush({
      ...page,
      events: [{ ...page.events[0], action: 'Creó <script>' }],
    });
    await expect(result).rejects.toThrow();
  });
});
