import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AUDIT_MODULES, AUDIT_ROLES, AuditLogService, type AuditEvent } from '../../data-access/audit-log.service';

interface HistoryRow extends AuditEvent {
  readonly placeholder: boolean;
}

type SortField = 'occurredAt' | 'actorName' | 'actorRole' | 'module' | 'action';

@Component({
  selector: 'app-admin-history',
  templateUrl: './admin-history.component.html',
})
export class AdminHistoryComponent implements OnInit {
  private readonly audit = inject(AuditLogService);
  protected readonly pageSizeOptions = [5, 10, 20] as const;
  protected readonly roles = signal<readonly string[]>(AUDIT_ROLES);
  protected readonly modules = signal<readonly string[]>(AUDIT_MODULES);
  protected readonly search = signal('');
  protected readonly role = signal('');
  protected readonly module = signal('');
  protected readonly sort = signal<SortField | ''>('');
  protected readonly direction = signal<'asc' | 'desc'>('desc');
  protected readonly page = signal(0);
  protected readonly pageSize = signal<(typeof this.pageSizeOptions)[number]>(5);
  protected readonly total = signal(0);
  protected readonly message = signal('');
  private readonly items = signal<readonly AuditEvent[]>([]);

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly currentPage = computed(() => Math.min(this.page(), this.pageCount() - 1));
  protected readonly visibleRows = computed(() => {
    const size = this.pageSize();
    const rows: HistoryRow[] = this.items().map((item) => ({ ...item, placeholder: false }));
    const pads = Array.from({ length: Math.max(0, size - rows.length) }, (_, index): HistoryRow => ({
      id: `vacio-${this.currentPage()}-${index}`,
      occurredAt: '',
      actorName: '',
      actorRole: 'Administrador',
      module: 'Sesión',
      action: '',
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

  protected onRole(event: Event): void {
    this.role.set((event.target as HTMLSelectElement).value);
    this.page.set(0);
    void this.load();
  }

  protected onModule(event: Event): void {
    this.module.set((event.target as HTMLSelectElement).value);
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

  protected formatWhen(value: string): string {
    if (!value) return '';
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short', hour12: false }).format(new Date(value));
  }

  private async load(): Promise<void> {
    const role = AUDIT_ROLES.find((item) => item === this.role());
    const module = AUDIT_MODULES.find((item) => item === this.module());
    try {
      const result = await this.audit.list({
        search: this.search().trim() || undefined,
        role,
        module,
        page: this.page() + 1,
        pageSize: this.pageSize(),
        sort: this.sort() || undefined,
        direction: this.sort() ? this.direction() : undefined,
      });
      this.total.set(result.total);
      this.items.set(result.events);
      this.roles.set(result.roles);
      this.modules.set(result.modules);
      this.message.set('');
    } catch {
      this.items.set([]);
      this.total.set(0);
      this.message.set('No se pudo cargar el historial.');
    }
  }
}
