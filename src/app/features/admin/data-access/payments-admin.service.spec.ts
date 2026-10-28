import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PaymentsAdminService } from './payments-admin.service';

const overview = {
  tariffs: [{ id: 'a2000001-0000-4000-8000-000000000001', code: 'REGULAR', name: 'Matrícula - Regular', amountCents: 23000, amount: '230.00' }],
  incidents: [],
  pendingIncidents: 0,
};

describe('PaymentsAdminService', () => {
  let service: PaymentsAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PaymentsAdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads the enrollment tariffs', async () => {
    const result = service.read();
    http.expectOne('/api/v1/auth/admin/payments').flush(overview);
    expect((await result).tariffs[0]?.name).toBe('Matrícula - Regular');
  });

  it('rejects a tariff name with markup', async () => {
    const result = service.read();
    http.expectOne('/api/v1/auth/admin/payments').flush({
      ...overview,
      tariffs: [{ ...overview.tariffs[0], name: '<Regular>' }],
    });
    await expect(result).rejects.toThrow();
  });
});
