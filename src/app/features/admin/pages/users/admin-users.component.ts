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
  templateUrl: './admin-users.component.html',
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
