import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { UserDirectoryService, type UserPage } from '../../data-access/user-directory.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiTableComponent, type UiTableColumn } from '../../../../shared/ui/table/ui-table.component';

const roleNames: Readonly<Record<string, string>> = {
  STUDENT: 'Estudiante', TEACHER: 'Docente', ADVISOR: 'Asesora', DIRECTOR: 'Director', ADMINISTRATOR: 'Administrador',
};
const statusNames: Readonly<Record<string, string>> = {
  ACTIVE: 'Activo', INVITED: 'Invitado', SUSPENDED: 'Suspendido', LOCKED: 'Bloqueado',
};

@Component({
  selector: 'app-admin-users',
  imports: [UiButtonComponent, UiTableComponent],
  template: `
    <header>
      <p class="text-xs font-medium text-[#7c8691]">Administración / Usuarios</p>
      <h1 class="mt-5 font-[var(--font-heading)] text-2xl font-semibold text-[#a9002d] sm:text-3xl">Usuarios</h1>
      <p class="mt-3 max-w-3xl leading-relaxed text-[#5e5254]">Consulta las cuentas y los roles registrados en el sistema.</p>
    </header>
    @if (loading()) {
      <p class="mt-8 text-[#5e5254]" role="status">Cargando usuarios…</p>
    } @else if (error()) {
      <p class="mt-8 rounded-lg bg-[#fff0f1] p-4 text-[#92001f]" role="alert">No se pudo consultar el directorio de usuarios. Inténtalo nuevamente.</p>
      <div class="mt-4"><ui-button type="button" (click)="load(page())">Reintentar</ui-button></div>
    } @else {
      <div class="mt-8">
        <ui-table [columns]="columns" [rows]="rows()" emptyMessage="No hay usuarios registrados." />
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-4" aria-label="Paginación del directorio">
        <ui-button type="button" variant="secondary" [disabled]="page() <= 1" (click)="load(page() - 1)">Anterior</ui-button>
        <span class="text-sm text-[#5e5254]">Página {{ page() }}</span>
        <ui-button type="button" variant="secondary" [disabled]="!hasMore()" (click)="load(page() + 1)">Siguiente</ui-button>
      </div>
      <p class="mt-6 text-sm text-[#5e5254]">Esta vista es de consulta. La creación y edición de cuentas aún no están disponibles.</p>
    }
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly directory = inject(UserDirectoryService);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly result = signal<UserPage | null>(null);
  protected readonly page = computed(() => this.result()?.page ?? 1);
  protected readonly hasMore = computed(() => this.result()?.hasMore ?? false);
  protected readonly columns: readonly UiTableColumn[] = [
    { key: 'username', label: 'Usuario' }, { key: 'name', label: 'Nombre' },
    { key: 'roles', label: 'Roles' }, { key: 'status', label: 'Estado' },
  ];
  protected readonly rows = computed(() => (this.result()?.users ?? []).map((user) => ({
    username: user.username, name: user.displayName ?? '—',
    roles: user.roles.map((role) => roleNames[role] ?? role).join(', ') || 'Sin rol',
    status: statusNames[user.status] ?? user.status,
  })));

  ngOnInit(): void { void this.load(1); }

  protected async load(page: number): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.result.set(await this.directory.list(page));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
