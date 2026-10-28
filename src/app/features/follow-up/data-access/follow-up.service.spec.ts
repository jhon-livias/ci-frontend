import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FollowUpService, absenceTone } from './follow-up.service';

const empty = { absenceLimit: 30, alerts: [], students: [], teachers: [], absences: [] };

describe('FollowUpService', () => {
  let service: FollowUpService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FollowUpService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads an empty consultation snapshot', async () => {
    const result = service.read();
    http.expectOne('/api/v1/auth/advisor/follow-up').flush(empty);
    expect((await result).students).toEqual([]);
  });

  it('rejects a student name with markup', async () => {
    const result = service.read();
    http.expectOne('/api/v1/auth/advisor/follow-up').flush({
      ...empty,
      alerts: [{ studentName: '<María>', groupLabel: 'Inglés', absencePercent: 20 }],
    });
    await expect(result).rejects.toThrow();
  });
});

describe('absenceTone', () => {
  it('uses the advisory semaphore', () => {
    expect(absenceTone(4, 30)).toBe('green');
    expect(absenceTone(12, 30)).toBe('yellow');
    expect(absenceTone(22, 30)).toBe('orange');
    expect(absenceTone(30, 30)).toBe('red');
  });
});
