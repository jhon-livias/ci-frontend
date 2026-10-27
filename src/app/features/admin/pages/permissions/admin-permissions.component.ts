import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';

import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent, type UiBreadcrumbItem } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../../shared/ui/select/ui-select.component';
import { UiTableComponent, type UiTableColumn, type UiTablePageChange, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';
import { PermissionCatalogService } from '../../data-access/permission-catalog.service';

interface PermissionFeature {
  readonly name: string;
  readonly enabled: boolean;
}

interface PermissionRow {
  readonly id: string;
  readonly name: string;
  readonly features: string;
  readonly functionalities: readonly PermissionFeature[];
  readonly enabled: boolean;
  readonly placeholder: boolean;
}

interface PermissionModuleOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-admin-permissions',
  imports: [FormField, FormRoot, UiButtonComponent, UiConfirmComponent, UiFieldComponent, UiFilterBarComponent, UiPageHeaderComponent, UiSelectComponent, UiTableComponent],
  templateUrl: './admin-permissions.component.html',
})
export class AdminPermissionsComponent implements OnInit {
  private readonly catalog = inject(PermissionCatalogService);
  protected readonly columns: readonly UiTableColumn[] = [
    { key: 'name', label: 'Permisos' },
    { key: 'features', label: 'Funcionalidades' },
    { key: 'enabled', label: 'Estado', kind: 'switch', align: 'center' },
  ];
  protected readonly listCrumbs: readonly UiBreadcrumbItem[] = [{ label: 'Inicio' }, { label: 'Permisos' }];
  protected readonly editorCrumbs: readonly UiBreadcrumbItem[] = [
    { label: 'Inicio', action: 'list' },
    { label: 'Permisos', action: 'list' },
    { label: 'Editar permiso' },
  ];
  protected readonly modules = signal<readonly PermissionModuleOption[]>([{ value: 'estudiante', label: 'Estudiante' }]);
  protected readonly search = signal('');
  protected readonly moduleId = signal('estudiante');
  protected readonly page = signal(0);
  protected readonly pageSize = signal<5 | 10 | 20>(5);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly editorOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingName = signal('');
  protected readonly editorFeatures = signal<readonly PermissionFeature[]>([]);
  protected readonly values = signal({ name: '', features: '' });
  protected readonly confirmation = signal<{ message: string; details: readonly UiConfirmDetail[]; run: () => Promise<void> } | null>(null);
  protected readonly permissionForm = form(this.values, (path) => {
    required(path.name, { message: 'Ingresa el permiso.' });
    required(path.features, { message: 'Ingresa las funcionalidades.' });
  });
  private readonly items = signal<readonly PermissionRow[]>([]);
  protected readonly tableRows = computed(() => this.items().map((item) => ({
    id: item.id,
    name: item.name,
    features: item.features,
    enabled: item.enabled,
  })));
  protected readonly allFeaturesOn = computed(() => this.editorFeatures().length > 0 && this.editorFeatures().every((item) => item.enabled));

  ngOnInit(): void {
    void this.load();
  }

  protected onCrumb(action: string): void {
    if (action === 'list') this.closeEditor();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
    void this.load();
  }

  protected onModule(value: string): void {
    this.moduleId.set(value);
    this.page.set(0);
    void this.load();
  }

  protected onTablePage(event: UiTablePageChange): void {
    if (event.pageSize !== 5 && event.pageSize !== 10 && event.pageSize !== 20) return;
    if (event.page === this.page() && event.pageSize === this.pageSize()) return;
    this.pageSize.set(event.pageSize);
    this.page.set(event.page);
    void this.load();
  }

  protected editFromTable(row: UiTableRow): void {
    const current = this.items().find((item) => item.id === row['id']);
    if (current) this.beginEdit(current);
  }

  protected toggleFromTable(row: UiTableRow): void {
    if (typeof row['id'] === 'string') void this.toggle(row['id']);
  }

  protected removeFromTable(row: UiTableRow): void {
    if (typeof row['id'] === 'string') this.remove(row['id']);
  }

  protected beginCreate(): void {
    this.editingId.set(null);
    this.values.set({ name: '', features: '' });
    this.editorOpen.set(true);
    this.message.set('');
  }

  protected beginEdit(row: PermissionRow): void {
    this.editingId.set(row.id);
    this.editingName.set(row.name);
    this.editorFeatures.set(row.functionalities.map((item) => ({ ...item })));
    this.editorOpen.set(false);
    this.message.set('');
  }

  protected toggleAllFeatures(): void {
    const enabled = !this.allFeaturesOn();
    this.editorFeatures.update((items) => items.map((item) => ({ ...item, enabled })));
  }

  protected toggleFeature(name: string): void {
    this.editorFeatures.update((items) => items.map((item) => (item.name === name ? { ...item, enabled: !item.enabled } : item)));
  }

  protected closeEditor(): void {
    this.editorOpen.set(false);
    this.editingId.set(null);
    this.editingName.set('');
    this.editorFeatures.set([]);
  }

  protected saveFeatures(): void {
    const id = this.editingId();
    const functionalities = this.editorFeatures();
    if (!id || functionalities.length === 0) {
      this.message.set('No se pudo guardar el permiso.');
      return;
    }
    const enabled = functionalities.filter((item) => item.enabled).map((item) => item.name).join(', ') || 'Ninguna';
    this.ask('¿Estás seguro que deseas guardar los cambios de este permiso?', [
      { label: 'Nombre', value: this.editingName() },
      { label: 'Funcionalidades', value: enabled },
    ], () => this.persistFeatures(id, functionalities));
  }

  protected async saveEditor(event: Event): Promise<void> {
    event.preventDefault();
    this.permissionForm().markAsTouched();
    const name = this.values().name.trim();
    const functionalities = this.values().features.split(/\s+-\s+/).map((item) => item.trim()).filter((item) => item.length > 0);
    if (this.permissionForm().invalid() || !this.validText(name) || functionalities.length === 0 || functionalities.length > 12 || functionalities.some((item) => !this.validText(item))) {
      this.message.set('Revisa el permiso y sus funcionalidades. Sepáralas con un guion.');
      return;
    }
    const moduleCode = this.moduleId();
    this.ask('¿Estás seguro que deseas registrar un nuevo permiso con los datos ingresados?', [
      { label: 'Nombre', value: name },
      { label: 'Funcionalidades', value: functionalities.join(', ') },
    ], () => this.persistPermission(moduleCode, name, functionalities));
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

  private ask(message: string, details: readonly UiConfirmDetail[], run: () => Promise<void>): void {
    this.confirmation.set({ message, details, run });
  }

  private async persistFeatures(id: string, functionalities: readonly PermissionFeature[]): Promise<void> {
    this.saving.set(true);
    this.message.set('');
    try {
      await this.catalog.update(id, { functionalities });
      this.closeEditor();
      await this.load();
    } catch {
      this.message.set('No se pudo guardar el permiso.');
    } finally {
      this.saving.set(false);
    }
  }

  private async persistPermission(moduleCode: string, name: string, functionalities: readonly string[]): Promise<void> {
    this.saving.set(true);
    this.message.set('');
    try {
      await this.catalog.create({ moduleCode, name, enabled: true, functionalities: functionalities.map((item) => ({ name: item, enabled: true })) });
      this.closeEditor();
      await this.load();
    } catch {
      this.message.set('No se pudo guardar el permiso.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggle(id: string): Promise<void> {
    const current = this.items().find((item) => item.id === id);
    if (!current) return;
    this.message.set('');
    try {
      await this.catalog.update(id, { enabled: !current.enabled });
      this.items.update((items) => items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
    } catch {
      this.message.set('No se pudo actualizar el permiso.');
    }
  }

  protected remove(id: string): void {
    const current = this.items().find((item) => item.id === id);
    if (!current) return;
    this.ask('¿Estás seguro que deseas eliminar este permiso?', [
      { label: 'Nombre', value: current.name },
      { label: 'Funcionalidades', value: current.features || 'Sin funcionalidades' },
    ], async () => {
      this.message.set('');
      try {
        await this.catalog.remove(id);
        if (this.editingId() === id) this.closeEditor();
        await this.load();
      } catch {
        this.message.set('No se pudo eliminar el permiso.');
      }
    });
  }

  private validText(value: string): boolean {
    return value.length > 0 && value.length <= 120 && !value.includes('<') && !value.includes('>');
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.catalog.list({
        module: this.moduleId(),
        search: this.search().trim() || undefined,
        page: this.page() + 1,
        pageSize: this.pageSize(),
      });
      this.modules.set(result.modules.map((module) => ({ value: module.code, label: module.name })));
      this.total.set(result.total);
      this.items.set(result.items.map((item) => ({
        id: item.id,
        name: item.name,
        features: item.functionalities.map((feature) => feature.name).join(' - '),
        functionalities: item.functionalities,
        enabled: item.enabled,
        placeholder: false,
      })));
      this.message.set('');
    } catch {
      this.items.set([]);
      this.total.set(0);
      this.message.set('No se pudieron cargar los permisos.');
    } finally {
      this.loading.set(false);
    }
  }
}
