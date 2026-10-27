import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AUDIT_MODULES, AUDIT_ROLES, AuditLogService, type AuditEvent } from '../../data-access/audit-log.service';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent, type UiBreadcrumbItem } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { UiTableComponent, type UiTableColumn, type UiTablePageChange, type UiTableSort } from '../../../../shared/ui/table/ui-table.component';

type SortField = 'occurredAt' | 'actorName' | 'actorRole' | 'module' | 'action';

@Component({
  selector: 'app-admin-history',
  imports: [UiFieldComponent, UiFilterBarComponent, UiPageHeaderComponent, UiSelectComponent, UiTableComponent],
  templateUrl: './admin-history.component.html',
})
export class AdminHistoryComponent implements OnInit {
  private readonly audit = inject(AuditLogService);
  protected readonly crumbs: readonly UiBreadcrumbItem[] = [{ label: 'Inicio' }, { label: 'Historial' }];
  protected readonly columns: readonly UiTableColumn[] = [
    { key: 'occurredAt', label: 'Fecha y hora', sortable: true },
    { key: 'actorName', label: 'Usuario', sortable: true },
    { key: 'actorRole', label: 'Rol', sortable: true },
    { key: 'module', label: 'Módulo', sortable: true },
    { key: 'action', label: 'Acción', sortable: true },
  ];
  protected readonly roles = signal<readonly string[]>(AUDIT_ROLES);
  protected readonly modules = signal<readonly string[]>(AUDIT_MODULES);
  protected readonly search = signal('');
  protected readonly role = signal('');
  protected readonly module = signal('');
  protected readonly sort = signal<SortField | ''>('');
  protected readonly direction = signal<'asc' | 'desc'>('desc');
  protected readonly page = signal(0);
  protected readonly pageSize = signal<5 | 10 | 20>(5);
  protected readonly total = signal(0);
  protected readonly message = signal('');
  private readonly items = signal<readonly AuditEvent[]>([]);
  protected readonly tableRows = computed(() => this.items().map((item) => ({
    id: item.id,
    occurredAt: this.formatWhen(item.occurredAt),
    actorName: item.actorName,
    actorRole: item.actorRole,
    module: item.module,
    action: item.action,
  })));
  protected readonly tableSort = computed<UiTableSort | null>(() => this.sort()
    ? { key: this.sort(), direction: this.direction() === 'asc' ? 'ascending' : 'descending' }
    : null);
  protected readonly roleOptions = computed<readonly UiSelectOption[]>(() => [
    { value: '', label: 'Todos los roles' },
    ...this.roles().map((role) => ({ value: role, label: role })),
  ]);
  protected readonly moduleOptions = computed<readonly UiSelectOption[]>(() => [
    { value: '', label: 'Todos los módulos' },
    ...this.modules().map((module) => ({ value: module, label: module })),
  ]);

  ngOnInit(): void {
    void this.load();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
    void this.load();
  }

  protected onRole(value: string): void {
    this.role.set(value);
    this.page.set(0);
    void this.load();
  }

  protected onModule(value: string): void {
    this.module.set(value);
    this.page.set(0);
    void this.load();
  }

  protected onTableSort(event: UiTableSort): void {
    if (event.key !== 'occurredAt' && event.key !== 'actorName' && event.key !== 'actorRole' && event.key !== 'module' && event.key !== 'action') return;
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
