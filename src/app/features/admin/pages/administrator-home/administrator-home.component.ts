import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { NotificationInboxService } from '../../data-access/notifications.service';
import { AdminHistoryComponent } from '../history/admin-history.component';
import { AdminModulesComponent } from '../modules/admin-modules.component';
import { AdminPermissionsComponent } from '../permissions/admin-permissions.component';
import { AdminUserTypesComponent } from '../user-types/admin-user-types.component';
import { AdminUsersComponent } from '../users/admin-users.component';
import { AdminSitesComponent } from '../sites/admin-sites.component';
import { AdminSiteCreateComponent } from '../sites/admin-site-create.component';

type AdminNavIcon = 'home' | 'modules' | 'sites' | 'permissions' | 'user-types' | 'users' | 'history';

@Component({
  imports: [NgTemplateOutlet, RouterLink, AdminModulesComponent, AdminHistoryComponent, AdminPermissionsComponent, AdminUserTypesComponent, AdminUsersComponent, AdminSitesComponent, AdminSiteCreateComponent],
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
  protected readonly navigation: readonly { label: string; icon: AdminNavIcon; route: string | null; section: string }[] = [
    { label: 'Inicio', icon: 'home', route: '/inicio', section: 'home' },
    { label: 'Modulos', icon: 'modules', route: '/administracion/modulos', section: 'modules' },
    { label: 'Sedes', icon: 'sites', route: '/administracion/sedes', section: 'sites' },
    { label: 'Permisos', icon: 'permissions', route: '/administracion/permisos', section: 'permissions' },
    { label: 'Tipos de usuario', icon: 'user-types', route: '/administracion/roles', section: 'roles' },
    { label: 'Usuarios', icon: 'users', route: '/administracion/usuarios', section: 'users' },
    { label: 'Historial', icon: 'history', route: '/administracion/historial', section: 'history' },
  ];
  private resolveSection(value: unknown): 'home' | 'modules' | 'history' | 'roles' | 'permissions' | 'users' | 'sites' | 'site-create' | 'site-edit' {
    return value === 'modules' || value === 'history' || value === 'roles' || value === 'permissions' || value === 'users' || value === 'sites' || value === 'site-create' || value === 'site-edit' ? value : 'home';
  }
  protected isCurrent(itemSection: string): boolean {
    return itemSection === this.section || (itemSection === 'sites' && (this.section === 'site-create' || this.section === 'site-edit'));
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
