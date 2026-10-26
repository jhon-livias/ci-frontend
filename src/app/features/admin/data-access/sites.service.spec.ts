import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SitesService } from './sites.service';

describe('SitesService', () => {
  let service: SitesService;
  let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(SitesService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('loads valid sites', async () => {
    const result = service.list();
    http.expectOne('/api/v1/auth/admin/sites').flush([{ id: 'c7fe9de9-0291-4762-8f22-fb7faf824f9e', code: 'TRUJILLO', name: 'Trujillo', location: null, active: true, districtCode: null }]);
    expect((await result)[0].name).toBe('Trujillo');
  });
  it('rejects malformed responses', async () => {
    const result = service.list();
    http.expectOne('/api/v1/auth/admin/sites').flush([{ name: 'Trujillo' }]);
    await expect(result).rejects.toThrow();
  });
  it('does not send invalid identifiers to the server', async () => { await expect(service.remove('../users')).rejects.toThrow(); });
  it('loads provinces only for a valid department code', async () => {
    const result = service.provinces('113');
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/auth/admin/sites/geography/provinces' && candidate.params.get('code') === '113');
    request.flush([{ code: '11301', name: 'TRUJILLO' }]);
    expect((await result)[0].code).toBe('11301');
    await expect(service.provinces('x')).rejects.toThrow();
  });
  it('loads a validated site detail for editing', async () => {
    const result = service.get('c7fe9de9-0291-4762-8f22-fb7faf824f9e');
    http.expectOne('/api/v1/auth/admin/sites/c7fe9de9-0291-4762-8f22-fb7faf824f9e').flush({
      id: 'c7fe9de9-0291-4762-8f22-fb7faf824f9e', code: 'TRUJILLO', name: 'Trujillo', location: null, active: true, districtCode: '1130101',
      street: 'Calle Victoria', postalCode: '13001', phone: null, email: null, contactName: null, contactPhone: null,
      geographicDistrict: { code: '1130101', name: 'TRUJILLO', province: { code: '11301', name: 'TRUJILLO', department: { code: '113', name: 'LA LIBERTAD' } } },
    });
    expect((await result).geographicDistrict?.province.department.code).toBe('113');
  });
});
