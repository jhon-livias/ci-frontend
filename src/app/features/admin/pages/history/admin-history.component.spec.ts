import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AUDIT_MODULES, AUDIT_ROLES, AuditLogService, type AuditPage } from '../../data-access/audit-log.service';
import { AdminHistoryComponent } from './admin-history.component';

const page = (): AuditPage => ({
  page: 1,
  pageSize: 5,
  total: 1,
  roles: AUDIT_ROLES,
  modules: AUDIT_MODULES,
  events: [{
    id: '6f1c2a40-7b2e-4c1a-9d11-0a1b2c3d6a01',
    occurredAt: '2026-10-26T21:08:55.000Z',
    actorName: 'Administrador UPRIT',
    actorRole: 'Administrador',
    module: 'Usuarios',
    action: 'Creó la cuenta de Ada Lima.',
  }],
});

describe('AdminHistoryComponent', () => {
  const list = vi.fn();

  beforeEach(() => {
    list.mockReset();
    list.mockResolvedValue(page());
    TestBed.configureTestingModule({
      imports: [AdminHistoryComponent],
      providers: [{ provide: AuditLogService, useValue: { list } }],
    });
  });

  it('shows the recorded movement', async () => {
    const fixture = TestBed.createComponent(AdminHistoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('HISTORIAL');
    expect(text).toContain('Administrador UPRIT');
    expect(text).toContain('Creó la cuenta de Ada Lima.');
    expect(text).toContain('Items por pagina:');
    expect(text).toContain('1-1 de 1');
  });

  it('filters the log by role', async () => {
    const fixture = TestBed.createComponent(AdminHistoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'Administrador';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'Administrador', page: 1, pageSize: 5 }));
  });
});
