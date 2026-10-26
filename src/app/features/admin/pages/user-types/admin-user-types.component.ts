import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UserTypeCatalogService, type UserTypePermissionOption } from '../../data-access/user-type-catalog.service';

interface UserTypeRow {
  readonly id: string;
  readonly name: string;
  readonly moduleName: string;
  readonly permissions: string;
  readonly permissionNames: readonly string[];
  readonly enabled: boolean;
  readonly placeholder: boolean;
}

interface EditorPermission {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
}

@Component({
  selector: 'app-admin-user-types',
  imports: [UiConfirmComponent],
  templateUrl: './admin-user-types.component.html',
})
export class AdminUserTypesComponent implements OnInit {
  private readonly catalog = inject(UserTypeCatalogService);
  protected readonly pageSizeOptions = [5, 10, 20] as const;
  protected readonly permissionOptions = signal<readonly UserTypePermissionOption[]>([]);
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly pageSize = signal<(typeof this.pageSizeOptions)[number]>(5);
  protected readonly total = signal(0);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly editorOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly editorName = signal('');
  protected readonly access = signal<readonly EditorPermission[]>([]);
  protected readonly confirmation = signal<{ message: string; details: readonly UiConfirmDetail[]; run: () => Promise<void> } | null>(null);
  private readonly items = signal<readonly UserTypeRow[]>([]);

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly currentPage = computed(() => Math.min(this.page(), this.pageCount() - 1));
  protected readonly visibleRows = computed(() => {
    const size = this.pageSize();
    const missing = Math.max(0, size - this.items().length);
    const pads = Array.from({ length: missing }, (_, index): UserTypeRow => ({
      id: `vacio-${this.currentPage()}-${index}`,
      name: '',
      moduleName: '',
      permissions: '',
      permissionNames: [],
      enabled: false,
      placeholder: true,
    }));
    return [...this.items(), ...pads];
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

  protected onName(event: Event): void {
    this.editorName.set((event.target as HTMLInputElement).value);
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
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

  protected beginCreate(): void {
    this.editingId.set(null);
    this.editorName.set('');
    this.access.set(this.permissionOptions().map((permission) => ({ id: permission.id, name: permission.name, enabled: false })));
    this.editorOpen.set(true);
    this.message.set('');
  }

  protected beginEdit(row: UserTypeRow): void {
    const enabled = new Set(row.permissionNames.map((name) => name.toLocaleLowerCase('es')));
    this.editingId.set(row.id);
    this.editorName.set(row.name);
    this.access.set(this.permissionOptions().map((permission) => ({
      id: permission.id,
      name: permission.name,
      enabled: enabled.has(permission.name.toLocaleLowerCase('es')),
    })));
    this.editorOpen.set(true);
    this.message.set('');
  }

  protected toggleAccess(id: string): void {
    this.access.update((items) => items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  }

  protected closeEditor(): void {
    this.editorOpen.set(false);
    this.editingId.set(null);
    this.editorName.set('');
  }

  protected async saveEditor(): Promise<void> {
    const name = this.editorName().trim();
    const permissions = this.access().map((item) => ({ id: item.id, enabled: item.enabled }));
    if (!this.validText(name) || !permissions.some((item) => item.enabled)) {
      this.message.set('Ingresa el nombre y activa al menos un permiso.');
      return;
    }
    const id = this.editingId();
    const enabled = this.access().filter((item) => item.enabled).map((item) => item.name).join(', ');
    this.ask(
      id ? '¿Estás seguro que deseas guardar los cambios de este tipo de usuario?' : '¿Estás seguro que deseas registrar un nuevo tipo de usuario con los datos ingresados?',
      [
        { label: 'Nombre', value: name },
        { label: 'Permisos', value: enabled },
      ],
      () => this.persistType(id, name, permissions),
    );
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

  private async persistType(id: string | null, name: string, permissions: readonly { id: string; enabled: boolean }[]): Promise<void> {
    this.saving.set(true);
    this.message.set('');
    try {
      if (id) await this.catalog.update(id, { name, permissions });
      else await this.catalog.create({ name, permissions });
      this.closeEditor();
      await this.load();
    } catch {
      this.message.set('No se pudo guardar el tipo de usuario.');
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
      this.message.set('No se pudo actualizar el tipo de usuario.');
    }
  }

  protected remove(id: string): void {
    const current = this.items().find((item) => item.id === id);
    if (!current) return;
    this.ask('¿Estás seguro que deseas eliminar este tipo de usuario?', [
      { label: 'Nombre', value: current.name },
      { label: 'Permisos', value: current.permissions || 'Sin permisos' },
    ], async () => {
      this.message.set('');
      try {
        await this.catalog.remove(id);
        if (this.editingId() === id) this.closeEditor();
        await this.load();
      } catch {
        this.message.set('No se pudo eliminar el tipo de usuario.');
      }
    });
  }

  private validText(value: string): boolean {
    return value.length > 0 && value.length <= 120 && !value.includes('<') && !value.includes('>');
  }

  private async load(): Promise<void> {
    try {
      const result = await this.catalog.list({
        search: this.search().trim() || undefined,
        page: this.page() + 1,
        pageSize: this.pageSize(),
      });
      this.permissionOptions.set(result.catalog);
      this.total.set(result.total);
      this.items.set(result.items.map((item) => ({
        id: item.id,
        name: item.name,
        moduleName: item.moduleName,
        permissions: item.permissions.join(' - '),
        permissionNames: item.permissions,
        enabled: item.enabled,
        placeholder: false,
      })));
      this.message.set('');
    } catch {
      this.items.set([]);
      this.total.set(0);
      this.message.set('No se pudieron cargar los tipos de usuario.');
    }
  }
}
