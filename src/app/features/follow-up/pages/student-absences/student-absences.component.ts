import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { FollowUpService, type StudentAbsenceRow } from '../../data-access/follow-up.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';

const allOption = (): UiSelectOption => ({ value: '', label: 'Todos' });
const uniqueOptions = (rows: readonly StudentAbsenceRow[], key: keyof StudentAbsenceRow): readonly UiSelectOption[] => {
  const values = [...new Set(rows.map((row) => String(row[key])))].sort((a, b) => a.localeCompare(b, 'es'));
  return [allOption(), ...values.map((value) => ({ value, label: value }))];
};

@Component({
  selector: 'app-student-absences',
  imports: [UiButtonComponent, UiFieldComponent, UiSelectComponent],
  templateUrl: './student-absences.component.html',
})
export class StudentAbsencesComponent implements OnInit {
  private readonly api = inject(FollowUpService);
  protected readonly documentNumber = signal('');
  protected readonly occurredOn = signal('');
  protected readonly status = signal('Injustificado');
  protected readonly groupCode = signal('');
  protected readonly language = signal('');
  protected readonly level = signal('');
  protected readonly applied = signal({ documentNumber: '', occurredOn: '', status: 'Injustificado', groupCode: '', language: '', level: '' });
  protected readonly rows = signal<readonly StudentAbsenceRow[]>([]);
  protected readonly message = signal('');
  protected readonly statusOptions: readonly UiSelectOption[] = [
    { value: 'Injustificado', label: 'Injustificado' },
    { value: 'Justificado', label: 'Justificado' },
    allOption(),
  ];
  protected readonly groupOptions = computed(() => uniqueOptions(this.rows(), 'groupCode'));
  protected readonly languageOptions = computed(() => uniqueOptions(this.rows(), 'language'));
  protected readonly levelOptions = computed(() => uniqueOptions(this.rows(), 'level'));
  protected readonly visible = computed(() => {
    const filter = this.applied();
    return this.rows().filter((row) =>
      (!filter.documentNumber || row.documentNumber.includes(filter.documentNumber)) &&
      (!filter.occurredOn || row.occurredOn === filter.occurredOn) &&
      (!filter.status || row.status === filter.status) &&
      (!filter.groupCode || row.groupCode === filter.groupCode) &&
      (!filter.language || row.language === filter.language) &&
      (!filter.level || row.level === filter.level),
    );
  });

  ngOnInit(): void {
    void this.load();
  }

  protected onDate(event: Event): void {
    this.occurredOn.set((event.target as HTMLInputElement).value);
  }

  protected consult(): void {
    this.applied.set({
      documentNumber: this.documentNumber().trim(),
      occurredOn: this.occurredOn(),
      status: this.status(),
      groupCode: this.groupCode(),
      language: this.language(),
      level: this.level(),
    });
  }

  protected clear(): void {
    this.documentNumber.set('');
    this.occurredOn.set('');
    this.status.set('Injustificado');
    this.groupCode.set('');
    this.language.set('');
    this.level.set('');
    this.consult();
  }

  private async load(): Promise<void> {
    try {
      this.rows.set((await this.api.read()).absences);
    } catch {
      this.message.set('No se pudieron cargar las faltas.');
    }
  }
}
