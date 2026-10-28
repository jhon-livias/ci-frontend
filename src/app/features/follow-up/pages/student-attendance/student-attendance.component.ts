import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { FollowUpService, absenceTone, type StudentAttendanceRow } from '../../data-access/follow-up.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';

const allOption = (label = 'Todos'): UiSelectOption => ({ value: '', label });

const uniqueOptions = (rows: readonly StudentAttendanceRow[], key: keyof StudentAttendanceRow): readonly UiSelectOption[] => {
  const values = [...new Set(rows.map((row) => String(row[key])))].sort((a, b) => a.localeCompare(b, 'es'));
  return [allOption(), ...values.map((value) => ({ value, label: value }))];
};

@Component({
  selector: 'app-student-attendance',
  imports: [UiButtonComponent, UiFieldComponent, UiSelectComponent],
  templateUrl: './student-attendance.component.html',
})
export class StudentAttendanceComponent implements OnInit {
  private readonly api = inject(FollowUpService);
  protected readonly documentNumber = signal('');
  protected readonly groupStatus = signal('');
  protected readonly language = signal('');
  protected readonly level = signal('');
  protected readonly groupCode = signal('');
  protected readonly applied = signal({ documentNumber: '', groupStatus: '', language: '', level: '', groupCode: '' });
  protected readonly rows = signal<readonly StudentAttendanceRow[]>([]);
  protected readonly limit = signal(30);
  protected readonly message = signal('');
  protected readonly groupStatusOptions: readonly UiSelectOption[] = [
    allOption(),
    { value: 'APERTURADO', label: 'Aperturado' },
    { value: 'CULMINADO', label: 'Culminado' },
  ];
  protected readonly languageOptions = computed(() => uniqueOptions(this.rows(), 'language'));
  protected readonly levelOptions = computed(() => uniqueOptions(this.rows(), 'level'));
  protected readonly groupOptions = computed(() => uniqueOptions(this.rows(), 'groupCode'));
  protected readonly visible = computed(() => {
    const filter = this.applied();
    return this.rows().filter((row) =>
      (!filter.documentNumber || row.documentNumber.includes(filter.documentNumber)) &&
      (!filter.groupStatus || row.groupStatus === filter.groupStatus) &&
      (!filter.language || row.language === filter.language) &&
      (!filter.level || row.level === filter.level) &&
      (!filter.groupCode || row.groupCode === filter.groupCode),
    );
  });

  ngOnInit(): void {
    void this.load();
  }

  protected tone(percent: number): string {
    return absenceTone(percent, this.limit());
  }

  protected consult(): void {
    this.applied.set({
      documentNumber: this.documentNumber().trim(),
      groupStatus: this.groupStatus(),
      language: this.language(),
      level: this.level(),
      groupCode: this.groupCode(),
    });
  }

  protected clear(): void {
    this.documentNumber.set('');
    this.groupStatus.set('');
    this.language.set('');
    this.level.set('');
    this.groupCode.set('');
    this.consult();
  }

  private async load(): Promise<void> {
    try {
      const snapshot = await this.api.read();
      this.rows.set(snapshot.students);
      this.limit.set(snapshot.absenceLimit);
    } catch {
      this.message.set('No se pudo cargar la consulta de asistencias.');
    }
  }
}
