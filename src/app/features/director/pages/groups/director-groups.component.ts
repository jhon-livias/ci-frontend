import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { DirectorOperationsService, type AcademicGroup, type Catalog, type ScheduleCombo } from '../../data-access/director-operations.service';
import { DirectorTeachersService, type DirectorTeacher } from '../../data-access/director-teachers.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';

const empty = () => ({
  code: '',
  kind: 'CLASSES',
  language: '',
  level: '',
  modality: '',
  studyType: '',
  meetUrl: '',
  startsAt: '',
  endsAt: '',
  teacherDocument: '',
  dayComboId: '',
  hourComboId: '',
});

@Component({
  selector: 'app-director-groups',
  imports: [UiButtonComponent, UiFieldComponent, UiSelectComponent],
  templateUrl: './director-groups.component.html',
})
export class DirectorGroupsComponent implements OnInit {
  private readonly api = inject(DirectorOperationsService);
  private readonly teachersApi = inject(DirectorTeachersService);
  protected readonly groups = signal<readonly AcademicGroup[]>([]);
  protected readonly catalogs = signal<readonly Catalog[]>([]);
  protected readonly combos = signal<readonly ScheduleCombo[]>([]);
  protected readonly teachers = signal<readonly DirectorTeacher[]>([]);
  protected readonly editingId = signal('');
  protected readonly viewing = signal<AcademicGroup | null>(null);
  protected readonly open = signal(false);
  protected readonly rescheduleId = signal('');
  protected readonly draft = signal(empty());
  protected readonly message = signal('');
  protected readonly kindOptions: readonly UiSelectOption[] = [
    { value: 'CLASSES', label: 'Clases' },
    { value: 'PROFICIENCY', label: 'Suficiencia' },
  ];
  protected readonly languageOptions = computed(() => this.options('LANGUAGE'));
  protected readonly levelOptions = computed(() => this.options('LEVEL'));
  protected readonly modalityOptions = computed(() => this.options('MODALITY'));
  protected readonly studyOptions = computed(() => this.options('STUDY_TYPE'));
  protected readonly dayComboOptions = computed(() => this.combos().map((combo) => ({ value: combo.id, label: combo.dayLabel || combo.days })));
  protected readonly hourComboOptions = computed(() => this.combos().map((combo) => ({ value: combo.id, label: combo.hourLabel || combo.hours })));
  protected readonly teacherName = computed(() => {
    const dni = this.draft().teacherDocument.trim();
    return this.teachers().find((row) => row.documentNumber === dni);
  });
  protected readonly teacherLabel = computed(() => {
    const teacher = this.teacherName();
    return teacher ? `${teacher.firstName} ${teacher.lastNames}` : 'Se completa con el DNI';
  });
  protected readonly isProficiency = computed(() => this.draft().kind === 'PROFICIENCY');

  ngOnInit(): void {
    void this.load();
  }

  protected set<K extends keyof ReturnType<typeof empty>>(key: K, value: string): void {
    this.draft.update((current) => ({ ...current, [key]: value }));
  }

  protected setDate(key: 'startsAt' | 'endsAt', event: Event): void {
    this.set(key, (event.target as HTMLInputElement).value);
  }

  protected startCreate(): void {
    this.editingId.set('');
    this.draft.set(empty());
    this.open.set(true);
  }

  protected startEdit(group: AcademicGroup): void {
    this.editingId.set(group.id);
    this.draft.set({
      code: group.code,
      kind: group.kind,
      language: group.language,
      level: group.level,
      modality: group.modality,
      studyType: group.studyType,
      meetUrl: group.meetUrl,
      startsAt: group.startsAt.slice(0, 10),
      endsAt: group.endsAt.slice(0, 10),
      teacherDocument: group.teacherDocument,
      dayComboId: group.dayComboId ?? '',
      hourComboId: group.hourComboId ?? '',
    });
    this.open.set(true);
  }

  protected startReschedule(group: AcademicGroup): void {
    this.rescheduleId.set(group.id);
    this.draft.update((current) => ({ ...current, startsAt: group.startsAt.slice(0, 10), endsAt: group.endsAt.slice(0, 10) }));
  }

  protected async save(): Promise<void> {
    const teacher = this.teacherName();
    if (!teacher) {
      this.message.set('El DNI no corresponde a un docente registrado.');
      return;
    }
    const current = this.draft();
    const proficiency = current.kind === 'PROFICIENCY';
    try {
      await this.api.saveGroup({
        code: current.code,
        kind: current.kind,
        language: current.language,
        level: proficiency ? 'Ninguno' : current.level,
        modality: current.modality,
        studyType: proficiency ? 'Ninguno' : current.studyType,
        meetUrl: proficiency ? '' : current.meetUrl,
        startsAt: `${current.startsAt}T12:00:00.000Z`,
        endsAt: `${current.endsAt}T12:00:00.000Z`,
        teacherUserId: teacher.id,
        teacherDocument: teacher.documentNumber,
        teacherName: `${teacher.firstName} ${teacher.lastNames}`.trim(),
        dayComboId: proficiency ? null : current.dayComboId || null,
        hourComboId: proficiency ? null : current.hourComboId || null,
      }, this.editingId() || undefined);
      this.open.set(false);
      this.message.set('');
      await this.load();
    } catch {
      this.message.set('No se pudo guardar el grupo.');
    }
  }

  protected async saveReschedule(): Promise<void> {
    const id = this.rescheduleId();
    if (!id) return;
    try {
      await this.api.reschedule(id, `${this.draft().startsAt}T12:00:00.000Z`, `${this.draft().endsAt}T12:00:00.000Z`);
      this.rescheduleId.set('');
      await this.load();
    } catch {
      this.message.set('No se pudo reprogramar el grupo.');
    }
  }

  protected async changeStatus(group: AcademicGroup, status: 'OPENED' | 'COMPLETED'): Promise<void> {
    try { await this.api.changeStatus(group.id, status, group.enrolledCount); await this.load(); }
    catch { this.message.set(status === 'OPENED' ? 'No se pudo aperturar: se requieren 30 matrículas activas.' : 'No se pudo culminar el grupo.'); }
  }

  private options(kind: string): readonly UiSelectOption[] {
    const catalog = this.catalogs().find((item) => item.kind === kind);
    return (catalog?.items ?? []).map((item) => ({ value: item.name, label: item.name }));
  }

  private async load(): Promise<void> {
    try {
      const [groups, catalogs, combos, teachers] = await Promise.all([
        this.api.groups(),
        this.api.catalogs(),
        this.api.schedules(),
        this.teachersApi.list(),
      ]);
      this.groups.set(groups);
      this.catalogs.set(catalogs);
      this.combos.set(combos);
      this.teachers.set(teachers);
    } catch {
      this.message.set('No se pudieron cargar los grupos.');
    }
  }
}
