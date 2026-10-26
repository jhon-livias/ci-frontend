import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ModuleCatalogService, type DirectoryModule } from '../../data-access/module-catalog.service';

interface ModuleRow extends DirectoryModule {
  readonly id: string;
  readonly placeholder: boolean;
}

type SortField = 'name' | 'users' | 'active' | 'inactive';

@Component({
  selector: 'app-admin-modules',
  templateUrl: './admin-modules.component.html',
})
export class AdminModulesComponent implements OnInit {
  private readonly catalog = inject(ModuleCatalogService);
  protected readonly pageSizeOptions = [5, 10, 20] as const;
  protected readonly search = signal('');
  protected readonly occupied = signal(false);
  protected readonly sort = signal<SortField | ''>('');
  protected readonly direction = signal<'asc' | 'desc'>('asc');
  protected readonly page = signal(0);
  protected readonly pageSize = signal<(typeof this.pageSizeOptions)[number]>(5);
  protected readonly total = signal(0);
  protected readonly message = signal('');
  private readonly items = signal<readonly DirectoryModule[]>([]);

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly currentPage = computed(() => Math.min(this.page(), this.pageCount() - 1));
  protected readonly visibleRows = computed(() => {
    const size = this.pageSize();
    const rows: ModuleRow[] = this.items().map((item) => ({ ...item, id: item.code, placeholder: false }));
    const pads = Array.from({ length: Math.max(0, size - rows.length) }, (_, index): ModuleRow => ({
      id: `vacio-${this.currentPage()}-${index}`,
      code: 'STUDENT',
      name: '',
      users: 0,
      active: 0,
      inactive: 0,
      placeholder: true,
    }));
    return [...rows, ...pads];
  });
  protected readonly rangeLabel = computed(() => {
    const total = this.total();
    if (total === 0) return '0-0 de 0';
    const start = this.currentPage() * this.pageSize() + 1;
    return `${start}-${Math.min(start + this.pageSize() - 1, total)} de ${total}`;
  });

  ngOnInit(): void {
    void this.load();
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(0);
    void this.load();
  }

  protected toggleOccupied(): void {
    this.occupied.update((current) => !current);
    this.page.set(0);
    void this.load();
  }

  protected changeSort(field: SortField): void {
    if (this.sort() === field) this.direction.update((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      this.sort.set(field);
      this.direction.set('asc');
    }
    this.page.set(0);
    void this.load();
  }

  protected changePageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (value === 5 || value === 10 || value === 20) {
      this.pageSize.set(value);
      this.page.set(0);
      void this.load();
    }
  }

  protected changePage(next: number): void {
    const page = Math.min(Math.max(next, 0), this.pageCount() - 1);
    if (page === this.currentPage()) return;
    this.page.set(page);
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
