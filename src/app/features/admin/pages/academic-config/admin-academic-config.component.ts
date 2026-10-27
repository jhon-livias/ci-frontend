import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';

import { AcademicConfigService, type AcademicCatalog, type AcademicCatalogKind, type AcademicRules } from '../../data-access/academic-config.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent, type UiBreadcrumbItem } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { UiTableComponent, type UiTableColumn } from '../../../../shared/ui/table/ui-table.component';

interface RulesForm {
  minStudents: string;
  maxStudents: string;
  absencePercent: string;
  passingGrade: string;
  evaluationsPerGroup: string;
  maxScorePerEvaluation: string;
}

const emptyRules = (): RulesForm => ({
  minStudents: '',
  maxStudents: '',
  absencePercent: '',
  passingGrade: '',
  evaluationsPerGroup: '',
  maxScorePerEvaluation: '',
});

@Component({
  selector: 'app-admin-academic-config',
  imports: [FormField, FormRoot, UiButtonComponent, UiConfirmComponent, UiFieldComponent, UiFilterBarComponent, UiPageHeaderComponent, UiSelectComponent, UiTableComponent],
  templateUrl: './admin-academic-config.component.html',
})
export class AdminAcademicConfigComponent implements OnInit {
  private readonly api = inject(AcademicConfigService);
  protected readonly crumbs: readonly UiBreadcrumbItem[] = [{ label: 'Inicio' }, { label: 'Configuración académica' }];
  protected readonly scheduleColumns: readonly UiTableColumn[] = [
    { key: 'number', label: 'Nro de horario', sortable: true },
    { key: 'day', label: 'Día', sortable: true },
    { key: 'classType', label: 'Tipo de clase', sortable: true },
    { key: 'hours', label: 'Horas', sortable: true },
    { key: 'owner', label: 'Responsable', sortable: true },
  ];
  protected readonly query = signal('');
  protected readonly catalogFilter = signal('');
  protected readonly catalogs = signal<readonly AcademicCatalog[]>([]);
  protected readonly schedules = signal<readonly { number: number; day: string; classType: string; hours: string; owner: string }[]>([]);
  protected readonly drafts = signal<Readonly<Record<AcademicCatalogKind, string>>>({
    LANGUAGE: '',
    LEVEL: '',
    STUDY_TYPE: '',
    MODALITY: '',
    GROUP_TYPE: '',
  });
  protected readonly message = signal('');
  protected readonly confirmation = signal<{ message: string; details: readonly UiConfirmDetail[]; run: () => Promise<void> } | null>(null);
  protected readonly values = signal<RulesForm>(emptyRules());
  protected readonly catalogFilterOptions = computed<readonly UiSelectOption[]>(() => [
    { value: '', label: 'Todos los catálogos' },
    ...this.catalogs().map((catalog) => ({ value: catalog.kind, label: catalog.title })),
  ]);
  protected readonly visibleCatalogs = computed(() => {
    const kind = this.catalogFilter();
    const q = this.query().trim().toLocaleLowerCase('es');
    return this.catalogs()
      .filter((catalog) => !kind || catalog.kind === kind)
      .map((catalog) => {
        if (!q || catalog.title.toLocaleLowerCase('es').includes(q)) return catalog;
        return { ...catalog, items: catalog.items.filter((item) => item.name.toLocaleLowerCase('es').includes(q)) };
      })
      .filter((catalog) => !q || catalog.title.toLocaleLowerCase('es').includes(q) || catalog.items.length > 0);
  });
  protected readonly visibleSchedules = computed(() => {
    const q = this.query().trim().toLocaleLowerCase('es');
    if (!q) return this.schedules();
    return this.schedules().filter((row) => `${row.number} ${row.day} ${row.classType} ${row.hours} ${row.owner}`.toLocaleLowerCase('es').includes(q));
  });
  protected readonly scheduleRows = computed(() => this.visibleSchedules().map((row) => ({
    number: row.number,
    day: row.day,
    classType: row.classType,
    hours: row.hours,
    owner: row.owner,
  })));
  protected readonly scheduleEmpty = computed(() => this.query().trim() ? 'No se encontraron combos horarios.' : 'Aún no hay combos horarios.');
  protected readonly rulesForm = form(this.values, (path) => {
    required(path.minStudents, { message: 'Ingresa el mínimo de alumnos.' });
    required(path.maxStudents, { message: 'Ingresa el máximo de alumnos.' });
    required(path.absencePercent, { message: 'Ingresa el porcentaje de inasistencia.' });
    required(path.passingGrade, { message: 'Ingresa la nota mínima.' });
    required(path.evaluationsPerGroup, { message: 'Ingresa las evaluaciones por grupo.' });
    required(path.maxScorePerEvaluation, { message: 'Ingresa el puntaje máximo.' });
  });

  ngOnInit(): void {
    void this.load();
  }

  protected onDraft(kind: AcademicCatalogKind, value: string): void {
    this.drafts.update((current) => ({ ...current, [kind]: value }));
  }

  protected askAdd(kind: AcademicCatalogKind, event: Event): void {
    event.preventDefault();
    const catalog = this.catalogs().find((item) => item.kind === kind);
    const name = (this.drafts()[kind] ?? '').replace(/\s+/g, ' ').trim();
    if (!catalog || !name || name.includes('<') || name.length > 80) {
      this.message.set('Escribe un nombre válido para el catálogo.');
      return;
    }
    this.confirmation.set({
      message: '¿Estás seguro que deseas agregar este elemento al catálogo?',
      details: [{ label: 'Catálogo', value: catalog.title }, { label: 'Nombre', value: name }],
      run: async () => {
        try {
          await this.api.addItem(kind, name);
          this.drafts.update((current) => ({ ...current, [kind]: '' }));
          this.message.set('');
          await this.load();
        } catch {
          this.message.set('No se pudo agregar el elemento.');
        }
      },
    });
  }

  protected askRemove(catalog: AcademicCatalog, item: AcademicCatalog['items'][number]): void {
    this.confirmation.set({
      message: '¿Estás seguro que deseas quitar este elemento del catálogo?',
      details: [{ label: 'Catálogo', value: catalog.title }, { label: 'Nombre', value: item.name }],
      run: async () => {
        try {
          await this.api.removeItem(item.id);
          this.message.set('');
          await this.load();
        } catch {
          this.message.set('No se pudo quitar el elemento.');
        }
      },
    });
  }

  protected askSave(event: Event): void {
    event.preventDefault();
    this.rulesForm().markAsTouched();
    const rules = this.parsedRules();
    if (!rules) {
      this.message.set(this.rulesMessage());
      return;
    }
    this.confirmation.set({
      message: '¿Estás seguro que deseas guardar las reglas del sistema?',
      details: [
        { label: 'Mínimo de alumnos', value: String(rules.minStudents) },
        { label: 'Máximo de alumnos', value: String(rules.maxStudents) },
        { label: 'Inasistencia', value: `${rules.absencePercent}%` },
        { label: 'Nota mínima', value: String(rules.passingGrade) },
        { label: 'Evaluaciones', value: String(rules.evaluationsPerGroup) },
        { label: 'Puntaje máximo', value: String(rules.maxScorePerEvaluation) },
      ],
      run: async () => {
        try {
          await this.api.saveRules(rules);
          this.message.set('Reglas guardadas.');
          await this.load();
        } catch {
          this.message.set('No se pudieron guardar las reglas.');
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
      const config = await this.api.read();
      this.catalogs.set(config.catalogs);
      this.schedules.set(config.schedules);
      this.values.set({
        minStudents: String(config.rules.minStudents),
        maxStudents: String(config.rules.maxStudents),
        absencePercent: String(config.rules.absencePercent),
        passingGrade: String(config.rules.passingGrade),
        evaluationsPerGroup: String(config.rules.evaluationsPerGroup),
        maxScorePerEvaluation: String(config.rules.maxScorePerEvaluation),
      });
    } catch {
      this.message.set('No se pudo cargar la configuración académica.');
    }
  }

  private parsedRules(): AcademicRules | null {
    const current = this.values();
    const minStudents = this.whole(current.minStudents, 0, 500);
    const maxStudents = this.whole(current.maxStudents, 0, 500);
    const absencePercent = this.whole(current.absencePercent, 0, 100);
    const passingGrade = this.whole(current.passingGrade, 0, 100);
    const evaluationsPerGroup = this.whole(current.evaluationsPerGroup, 1, 20);
    const maxScorePerEvaluation = this.whole(current.maxScorePerEvaluation, 1, 100);
    if (minStudents === null || maxStudents === null || minStudents > maxStudents) return null;
    if (absencePercent === null || passingGrade === null || evaluationsPerGroup === null || maxScorePerEvaluation === null) return null;
    return { minStudents, maxStudents, absencePercent, passingGrade, evaluationsPerGroup, maxScorePerEvaluation };
  }

  private rulesMessage(): string {
    const current = this.values();
    const minStudents = this.whole(current.minStudents, 0, 500);
    const maxStudents = this.whole(current.maxStudents, 0, 500);
    if (minStudents !== null && maxStudents !== null && minStudents > maxStudents) return 'El mínimo de alumnos no puede ser mayor que el máximo.';
    if (this.whole(current.absencePercent, 0, 100) === null) return 'El porcentaje de inasistencia debe estar entre 0 y 100.';
    if (this.whole(current.passingGrade, 0, 100) === null) return 'La nota mínima aprobatoria no puede superar 100.';
    if (this.whole(current.evaluationsPerGroup, 1, 20) === null || this.whole(current.maxScorePerEvaluation, 1, 100) === null) {
      return 'Las evaluaciones y el puntaje máximo deben ser mayores que cero.';
    }
    return 'Revisa las reglas marcadas para continuar.';
  }

  private whole(value: string, min: number, max: number): number | null {
    if (!/^\d{1,3}$/u.test(value)) return null;
    const parsed = Number(value);
    return parsed >= min && parsed <= max ? parsed : null;
  }
}
