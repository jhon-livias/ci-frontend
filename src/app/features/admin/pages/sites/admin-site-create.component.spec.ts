import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { SitesService } from '../../data-access/sites.service';
import { AdminSiteCreateComponent } from './admin-site-create.component';

describe('AdminSiteCreateComponent', () => {
  const save = vi.fn();
  beforeEach(() => { save.mockReset(); TestBed.configureTestingModule({ imports: [AdminSiteCreateComponent], providers: [provideRouter([]), { provide: SitesService, useValue: { save } }] }); });
  it('displays the requested fields and blocks an empty submission', async () => {
    const fixture = TestBed.createComponent(AdminSiteCreateComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Departamento');
    expect(fixture.nativeElement.textContent).toContain('Teléfono del responsable');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable(); fixture.detectChanges();
    expect(save).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });
});
