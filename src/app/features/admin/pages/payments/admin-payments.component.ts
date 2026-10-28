import { Component, OnInit, inject, signal } from '@angular/core';

import { PaymentsAdminService, type EnrollmentTariff, type PaymentIncident } from '../../data-access/payments-admin.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';

const parseSoles = (value: string): number | null => {
  const text = value.trim();
  if (!/^\d{1,5}(?:\.\d{1,2})?$/u.test(text)) return null;
  const [integer, fraction = ''] = text.split('.');
  const cents = Number(integer) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isInteger(cents) && cents >= 0 && cents <= 9_999_999 ? cents : null;
};

@Component({
  selector: 'app-admin-payments',
  imports: [UiButtonComponent, UiConfirmComponent],
  templateUrl: './admin-payments.component.html',
})
export class AdminPaymentsComponent implements OnInit {
  private readonly api = inject(PaymentsAdminService);
  protected readonly tariffs = signal<readonly EnrollmentTariff[]>([]);
  protected readonly incidents = signal<readonly PaymentIncident[]>([]);
  protected readonly editingId = signal('');
  protected readonly draft = signal('');
  protected readonly message = signal('');
  protected readonly confirmation = signal<{ message: string; details: readonly UiConfirmDetail[]; run: () => Promise<void> } | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected onDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected startEdit(row: EnrollmentTariff): void {
    this.editingId.set(row.id);
    this.draft.set(row.amount);
    this.message.set('');
  }

  protected cancelEdit(): void {
    this.editingId.set('');
    this.draft.set('');
  }

  protected askSave(row: EnrollmentTariff): void {
    const amountCents = parseSoles(this.draft());
    if (amountCents === null) {
      this.message.set('El monto no es válido.');
      return;
    }
    const amount = (amountCents / 100).toFixed(2);
    this.confirmation.set({
      message: '¿Estás seguro que deseas guardar el nuevo monto de esta tarifa?',
      details: [
        { label: 'Concepto', value: row.name },
        { label: 'Monto anterior', value: `S/ ${row.amount}` },
        { label: 'Monto nuevo', value: `S/ ${amount}` },
      ],
      run: async () => {
        try {
          await this.api.updateTariff(row.id, amountCents);
          this.cancelEdit();
          this.message.set('');
          await this.load();
        } catch {
          this.message.set('No se pudo guardar la tarifa.');
        }
      },
    });
  }

  protected askResolve(row: PaymentIncident): void {
    this.confirmation.set({
      message: '¿Estás seguro que deseas marcar esta incidencia como resuelta?',
      details: [
        { label: 'Alumno', value: row.studentName },
        { label: 'Concepto', value: row.concept },
        { label: 'Error', value: row.error },
      ],
      run: async () => {
        try {
          await this.api.resolveIncident(row.id);
          this.message.set('');
          await this.load();
        } catch {
          this.message.set('No se pudo actualizar la incidencia.');
        }
      },
    });
  }

  protected formatWhen(value: string): string {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', hour12: false }).format(new Date(value));
  }

  protected cancelConfirmation(): void {
    this.confirmation.set(null);
  }

  protected async acceptConfirmation(): Promise<void> {
    const current = this.confirmation();
    if (!current) return;
    this.confirmation.set(null);
    await current.run();
  }

  private async load(): Promise<void> {
    try {
      const overview = await this.api.read();
      this.tariffs.set(overview.tariffs);
      this.incidents.set(overview.incidents);
    } catch {
      this.message.set('No se pudieron cargar las tarifas.');
    }
  }
}
