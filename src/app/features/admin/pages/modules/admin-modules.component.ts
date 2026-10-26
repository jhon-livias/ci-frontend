import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ModuleCatalogService, type ModuleStatus, type SystemModule } from '../../data-access/module-catalog.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';

const statusLabels: Readonly<Record<ModuleStatus, string>> = {
  PLANNED: 'Pendiente', IN_PROGRESS: 'En desarrollo', COMPLETE: 'Disponible',
};

@Component({
  selector: 'app-admin-modules',
  imports: [UiButtonComponent, UiFieldComponent, UiSelectComponent, UiTableComponent],
  templateUrl: './admin-modules.component.html',
})
export class AdminModulesComponent implements OnInit {
  private readonly catalog = inject(ModuleCatalogService);
  protected readonly modules = signal<readonly SystemModule[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly search = signal('');
  protected readonly statusFilter = signal('');
  protected readonly columns: readonly UiTableColumn[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'description', label: 'Descripción', sortable: true },
    { key: 'status', label: 'Estado', sortable: true },
  ];
  protected readonly statusOptions: readonly UiSelectOption[] = [
    { value: 'IN_PROGRESS', label: 'En desarrollo' },
    { value: 'PLANNED', label: 'Pendiente' },
    { value: 'COMPLETE', label: 'Disponible' },
  ];
  protected readonly filteredModules = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('es');
    const status = this.statusFilter();
    return this.modules().filter((module) =>
      (!status || module.status === status) && `${module.name} ${module.description}`.toLocaleLowerCase('es').includes(query),
    );
  });
  protected readonly tableRows = computed<readonly UiTableRow[]>(() => this.filteredModules().map((module) => ({
    name: module.name, description: module.description, status: statusLabels[module.status],
  })));

  ngOnInit(): void { void this.load(); }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.modules.set(await this.catalog.list());
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

}
