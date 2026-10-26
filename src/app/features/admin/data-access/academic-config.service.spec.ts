import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AcademicConfigService } from './academic-config.service';

const config = {
  catalogs: [
    { kind: 'LANGUAGE', title: 'Idiomas', items: [{ id: 'a1000001-0000-4000-8000-000000000001', name: 'Inglés' }] },
    { kind: 'LEVEL', title: 'Niveles', items: [{ id: 'b1000001-0000-4000-8000-000000000001', name: 'Básico 1' }] },
    { kind: 'STUDY_TYPE', title: 'Tipos de estudio', items: [{ id: 'c1000001-0000-4000-8000-000000000001', name: 'Regular' }] },
    { kind: 'MODALITY', title: 'Modalidades', items: [{ id: 'd1000001-0000-4000-8000-000000000001', name: 'Virtual' }] },
    { kind: 'GROUP_TYPE', title: 'Tipo de grupo', items: [{ id: 'e1000001-0000-4000-8000-000000000001', name: 'Clases' }] },
  ],
  rules: { minStudents: 31, maxStudents: 50, absencePercent: 30, passingGrade: 60, evaluationsPerGroup: 5, maxScorePerEvaluation: 20 },
  schedules: [],
};

describe('AcademicConfigService', () => {
  let service: AcademicConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AcademicConfigService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads catalogs and rules', async () => {
    const result = service.read();
    http.expectOne('/api/v1/auth/admin/academic-config').flush(config);
    expect((await result).catalogs[0]?.items[0]?.name).toBe('Inglés');
  });

  it('rejects a catalog name with markup', async () => {
    const result = service.read();
    http.expectOne('/api/v1/auth/admin/academic-config').flush({
      ...config,
      catalogs: config.catalogs.map((catalog, index) => index === 0 ? { ...catalog, items: [{ id: catalog.items[0]?.id, name: '<Inglés>' }] } : catalog),
    });
    await expect(result).rejects.toThrow();
  });
});
