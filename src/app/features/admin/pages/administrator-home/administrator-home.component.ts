import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { NotificationInboxService } from '../../data-access/notifications.service';
import { AdminModulesComponent } from '../modules/admin-modules.component';
import { AdminAccessPolicyComponent } from '../access-policy/admin-access-policy.component';
import { AdminUsersComponent } from '../users/admin-users.component';
import { AdminSitesComponent } from '../sites/admin-sites.component';
import { AdminSiteCreateComponent } from '../sites/admin-site-create.component';

@Component({
  imports: [RouterLink, AdminModulesComponent, AdminAccessPolicyComponent, AdminUsersComponent, AdminSitesComponent, AdminSiteCreateComponent],
  templateUrl: './administrator-home.component.html',
})
export class AdministratorHomeComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly inbox = inject(NotificationInboxService);
  protected readonly notifications = this.inbox.notifications;

  ngOnInit(): void {
    this.inbox.connect();
    void this.inbox.refresh().catch(() => undefined);
  }
  protected readonly section = this.resolveSection(inject(ActivatedRoute).snapshot.data['section']);
  protected readonly menuOpen = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly notificationsOpen = signal(false);
  protected readonly displayName = computed(
    () => this.session.user()?.displayName || 'Administrador',
  );
  protected readonly navigation: readonly { label: string; icon: string; route: string | null; section: string }[] = [
    { label: 'Inicio', icon: '⌂', route: '/inicio', section: 'home' },
    { label: 'Módulos', icon: '▦', route: '/administracion/modulos', section: 'modules' },
    { label: 'Sedes', icon: '⌖', route: '/administracion/sedes', section: 'sites' },
    { label: 'Permisos', icon: '▤', route: '/administracion/permisos', section: 'permissions' },
    { label: 'Roles', icon: '♟', route: '/administracion/roles', section: 'roles' },
    { label: 'Usuarios', icon: '▧', route: '/administracion/usuarios', section: 'users' },
  ];
  private resolveSection(value: unknown): 'home' | 'modules' | 'roles' | 'permissions' | 'users' | 'sites' | 'site-create' | 'site-edit' {
    return value === 'modules' || value === 'roles' || value === 'permissions' || value === 'users' || value === 'sites' || value === 'site-create' || value === 'site-edit' ? value : 'home';
  }
  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
  protected toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen.set(false);
    this.profileOpen.update((open) => !open);
  }
  protected toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen.set(false);
    this.notificationsOpen.update((open) => !open);
  }
  protected closePanels(): void {
    this.profileOpen.set(false);
    this.notificationsOpen.set(false);
  }
  protected async logout(): Promise<void> {
    try {
      await this.session.logout();
    } finally {
      this.inbox.disconnect();
      await this.router.navigateByUrl('/login');
    }
  }
}
