import { Component, OnInit, inject, signal } from '@angular/core';

import { DirectorOperationsService, type ScheduleCombo } from '../../data-access/director-operations.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const HOURS = ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'] as const;

interface DayDraft {
  selected: boolean;
  classKind: string;
  startHour: string;
  startPeriod: string;
  endHour: string;
  endPeriod: string;
}

const emptyDay = (): DayDraft => ({ selected: false, classKind: '', startHour: '', startPeriod: '', endHour: '', endPeriod: '' });

const toMinutes = (hour: string, period: string): number => {
  const twelve = Number(hour.slice(0, 2));
  const base = twelve === 12 ? 0 : twelve;
  return (period === 'PM' ? 12 * 60 : 0) + base * 60;
};

@Component({
  selector: 'app-director-schedule-combos',
  imports: [UiButtonComponent, UiConfirmComponent],
  templateUrl: './director-schedule-combos.component.html',
})
export class DirectorScheduleCombosComponent implements OnInit {
  private readonly api = inject(DirectorOperationsService);
  protected readonly days = DAYS;
  protected readonly hours = HOURS;
  protected readonly drafts = signal<Record<string, DayDraft>>(Object.fromEntries(DAYS.map((day) => [day, emptyDay()])));
  protected readonly combos = signal<readonly ScheduleCombo[]>([]);
  protected readonly message = signal('');
  protected readonly confirmation = signal<{ message: string; details: readonly UiConfirmDetail[]; run: () => Promise<void> } | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected draft(day: string): DayDraft {
    return this.drafts()[day] ?? emptyDay();
  }

  protected patch(day: string, change: Partial<DayDraft>): void {
    this.drafts.update((current) => ({ ...current, [day]: { ...this.draft(day), ...change } }));
  }

  protected setChecked(day: string, event: Event): void {
    this.patch(day, { selected: (event.target as HTMLInputElement).checked });
  }

  protected setText(day: string, key: 'classKind' | 'startHour' | 'startPeriod' | 'endHour' | 'endPeriod', event: Event): void {
    this.patch(day, { [key]: (event.target as HTMLSelectElement).value });
  }

  protected async save(): Promise<void> {
    const slots = DAYS.flatMap((day) => {
      const row = this.draft(day);
      if (!row.selected) return [];
      return [{
        day,
        classKind: row.classKind,
        startMinutes: toMinutes(row.startHour, row.startPeriod),
        endMinutes: toMinutes(row.endHour, row.endPeriod),
      }];
    });
    if (slots.length === 0) {
      this.message.set('Selecciona al menos un día.');
      return;
    }
    if (slots.some((slot) => !slot.classKind || !Number.isFinite(slot.startMinutes) || !Number.isFinite(slot.endMinutes))) {
      this.message.set('Completa el tipo de clase y las horas de cada día marcado.');
      return;
    }
    try {
      await this.api.createSchedule(slots);
      this.drafts.set(Object.fromEntries(DAYS.map((day) => [day, emptyDay()])));
      this.message.set('');
      await this.load();
    } catch {
      this.message.set('No se pudo guardar el combo.');
    }
  }

  protected askRemove(combo: ScheduleCombo): void {
    this.confirmation.set({
      message: '¿Estás seguro que deseas eliminar este combo horario?',
      details: [{ label: 'Nro', value: String(combo.number) }, { label: 'Días', value: combo.days }],
      run: async () => {
        try {
          await this.api.removeSchedule(combo.id);
          await this.load();
        } catch {
          this.message.set('No se pudo eliminar el combo. Puede estar asignado a un grupo.');
        }
      },
    });
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
      this.combos.set(await this.api.schedules());
    } catch {
      this.message.set('No se pudieron cargar los combos.');
    }
  }
}
