import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PaymentsAdminService, type PaymentsOverview } from '../../data-access/payments-admin.service';
import { AdminPaymentsComponent } from './admin-payments.component';

const overview = (): PaymentsOverview => ({
  tariffs: [{ id: 'a2000001-0000-4000-8000-000000000001', code: 'REGULAR', name: 'Matrícula - Regular', amountCents: 23000, amount: '230.00' }],
  incidents: [],
  pendingIncidents: 0,
});

describe('AdminPaymentsComponent', () => {
  const read = vi.fn();
  const updateTariff = vi.fn();

  beforeEach(() => {
    read.mockReset();
    updateTariff.mockReset();
    read.mockResolvedValue(overview());
    updateTariff.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [AdminPaymentsComponent],
      providers: [{ provide: PaymentsAdminService, useValue: { read, updateTariff, resolveIncident: vi.fn() } }],
    });
  });

  it('shows the enrollment tariffs and an empty incident list', async () => {
    const fixture = TestBed.createComponent(AdminPaymentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('TARIFAS Y PAGOS');
    expect(text).toContain('Matrícula - Regular');
    expect(text).toContain('230.00');
    expect(text).toContain('Aún no hay incidencias de pago.');
  });

  it('asks for confirmation before saving a new amount', async () => {
    const fixture = TestBed.createComponent(AdminPaymentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const amount = fixture.nativeElement.querySelector('#tariff-amount') as HTMLInputElement;
    amount.value = '250';
    amount.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const save = [...fixture.nativeElement.querySelectorAll('button')].find((button) => button.textContent?.includes('Guardar')) as HTMLButtonElement;
    save.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm__accept') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(updateTariff).toHaveBeenCalledWith('a2000001-0000-4000-8000-000000000001', 25000);
  });
});
