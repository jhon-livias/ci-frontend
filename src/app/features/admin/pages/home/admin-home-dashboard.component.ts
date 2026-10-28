import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PaymentsAdminService } from '../../data-access/payments-admin.service';
import { AuditLogService, type AuditEvent } from '../../data-access/audit-log.service';
import { ModuleCatalogService } from '../../data-access/module-catalog.service';
import { UserDirectoryService } from '../../data-access/user-directory.service';

interface RoleBar {
  readonly label: string;
  readonly count: number;
  readonly width: number;
  readonly color: string;
}

const ROLE_BARS = [
  { code: 'STUDENT', label: 'Estudiante', color: '#a9002d' },
  { code: 'TEACHER', label: 'Docente', color: '#7b3ff2' },
  { code: 'ADVISOR', label: 'Asesora', color: '#c89600' },
  { code: 'DIRECTOR', label: 'Director', color: '#1f8a4c' },
  { code: 'ADMINISTRATOR', label: 'Administrador', color: '#5e5254' },
] as const;

@Component({
  selector: 'app-admin-home-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-home-dashboard.component.html',
})
export class AdminHomeDashboardComponent implements OnInit {
  private readonly users = inject(UserDirectoryService);
  private readonly modules = inject(ModuleCatalogService);
  private readonly audit = inject(AuditLogService);
  private readonly payments = inject(PaymentsAdminService);
  protected readonly activeUsers = signal(0);
  protected readonly pendingIncidents = signal(0);
  protected readonly bars = signal<readonly RoleBar[]>(ROLE_BARS.map((role) => ({ label: role.label, count: 0, width: 0, color: role.color })));
  protected readonly activity = signal<readonly AuditEvent[]>([]);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.load();
  }

  protected formatWhen(value: string): string {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short', hour12: false }).format(new Date(value));
  }

  private async load(): Promise<void> {
    const [accounts, directory, history, overview] = await Promise.all([
      this.users.list({ status: 'ACTIVE', page: 1, pageSize: 5 }).then((page) => page.total, () => null),
      this.modules.list({ page: 1, pageSize: 5 }).then((page) => page.modules, () => null),
      this.audit.list({ page: 1, pageSize: 5 }).then((page) => page.events.slice(0, 4), () => null),
      this.payments.read().then((page) => page.pendingIncidents, () => null),
    ]);
    if (accounts === null || directory === null || history === null || overview === null) {
      this.message.set('No se pudo cargar el resumen.');
    }
    if (accounts !== null) this.activeUsers.set(accounts);
    if (directory !== null) {
      const counts = new Map(directory.map((item) => [item.code, item.active]));
      const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
      this.bars.set(ROLE_BARS.map((role) => {
        const count = counts.get(role.code) ?? 0;
        return { label: role.label, count, width: total === 0 ? 0 : Math.round((count / total) * 100), color: role.color };
      }));
    }
    if (history !== null) this.activity.set(history);
    if (overview !== null) this.pendingIncidents.set(overview);
  }
}
