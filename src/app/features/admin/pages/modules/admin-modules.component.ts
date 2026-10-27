import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ModuleCatalogService, type DirectoryModule } from '../../data-access/module-catalog.service';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent, type UiBreadcrumbItem } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiTableComponent, type UiTableColumn, type UiTablePageChange, type UiTableSort } from '../../../../shared/ui/table/ui-table.component';

type SortField = 'name' | 'users' | 'active' | 'inactive';

@Component({
  selector: 'app-admin-modules',
  imports: [UiFieldComponent, UiFilterBarComponent, UiPageHeaderComponent, UiTableComponent],
  templateUrl: './admin-modules.component.html',
})
export class AdminModulesComponent implements OnInit {
  private readonly catalog = inject(ModuleCatalogService);
  protected readonly crumbs: readonly UiBreadcrumbItem[] = [{ label: 'Inicio' }, { label: 'Módulos' }];
  protected readonly columns: readonly UiTableColumn[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'users', label: 'Usuarios', sortable: true },
    { key: 'active', label: 'Activos', sortable: true },
    { key: 'inactive', label: 'No activos', sortable: true },
  ];
  protected readonly search = signal('');
  protected readonly occupied = signal(false);
  protected readonly sort = signal<SortField | ''>('');
  protected readonly direction = signal<'asc' | 'desc'>('asc');
  protected readonly page = signal(0);
  protected readonly pageSize = signal<5 | 10 | 20>(5);
  protected readonly total = signal(0);
  protected readonly message = signal('');
  private readonly items = signal<readonly DirectoryModule[]>([]);
  protected readonly tableRows = computed(() => this.items().map((item) => ({
    id: item.code,
    name: item.name,
    users: item.users,
    active: item.active,
    inactive: item.inactive,
  })));
  protected readonly tableSort = computed<UiTableSort | null>(() => this.sort()
    ? { key: this.sort(), direction: this.direction() === 'asc' ? 'ascending' : 'descending' }
    : null);

  ngOnInit(): void {
    void this.load();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
    void this.load();
  }

  protected toggleOccupied(): void {
    this.occupied.update((current) => !current);
    this.page.set(0);
    void this.load();
  }

  protected onTableSort(event: UiTableSort): void {
    if (event.key !== 'name' && event.key !== 'users' && event.key !== 'active' && event.key !== 'inactive') return;
    this.sort.set(event.key);
    this.direction.set(event.direction === 'ascending' ? 'asc' : 'desc');
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

  private async load(): Promise<void> {
    try {
      const result = await this.catalog.list({
        search: this.search().trim() || undefined,
        occupied: this.occupied() || undefined,
        page: this.page() + 1,
        pageSize: this.pageSize(),
        sort: this.sort() || undefined,
        direction: this.sort() ? this.direction() : undefined,
      });
      this.total.set(result.total);
      this.items.set(result.modules);
      this.message.set('');
    } catch {
      this.items.set([]);
      this.total.set(0);
      this.message.set('No se pudieron cargar los módulos.');
    }
  }
}
