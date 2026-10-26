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
  template: `
    <header class="max-w-3xl">
      <p class="text-xs font-medium text-[#7c8691]">Administración / Módulos</p>
      <h1 class="mt-5 font-[var(--font-heading)] text-2xl font-semibold tracking-tight text-[#a9002d] sm:text-3xl">Módulos del sistema</h1>
      <p class="mt-3 leading-relaxed text-[#5e5254]">Consulta las áreas funcionales del Centro de Idiomas y su estado de desarrollo.</p>
    </header>

    @if (loading()) {
      <p class="mt-8 text-[#5e5254]" role="status">Cargando módulos…</p>
    } @else if (error()) {
      <p class="mt-8 rounded-lg bg-[#fff0f1] p-4 text-[#92001f]" role="alert">No se pudo cargar el catálogo. Comprueba la conexión y vuelve a intentarlo.</p>
      <div class="mt-4"><ui-button type="button" (click)="load()">Reintentar</ui-button></div>
    } @else {
      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <ui-field id="module-search" label="Buscar módulo" type="search" placeholder="Nombre o descripción" [(value)]="search" />
        <ui-select id="module-status" label="Estado" placeholder="Todos los estados" [options]="statusOptions" [(value)]="statusFilter" />
      </div>
      <p class="mt-5 text-sm text-[#5e5254]" role="status">{{ filteredModules().length }} de {{ modules().length }} módulos</p>
      <div class="mt-5">
        <ui-table [columns]="columns" [rows]="tableRows()" emptyMessage="No se encontraron módulos con esos filtros." />
      </div>
    }
  `,
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
