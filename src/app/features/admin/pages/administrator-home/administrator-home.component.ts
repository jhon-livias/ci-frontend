import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuthApiService } from '../../../auth/data-access/auth-api.service';
import { AdminModulesComponent } from '../modules/admin-modules.component';
import { AdminAccessPolicyComponent } from '../access-policy/admin-access-policy.component';
import { AdminUsersComponent } from '../users/admin-users.component';
import { AdminSitesComponent } from '../sites/admin-sites.component';
import { AdminSiteCreateComponent } from '../sites/admin-site-create.component';

@Component({
  imports: [RouterLink, AdminModulesComponent, AdminAccessPolicyComponent, AdminUsersComponent, AdminSitesComponent, AdminSiteCreateComponent],
  template: ` <main class="min-h-dvh bg-[#fcf9fa]" (click)="closePanels()">
    <section class="relative min-h-dvh overflow-hidden bg-[#fcf9fa]">
      <div class="relative z-30 flex h-18 items-center justify-between px-5 sm:h-20 sm:px-8">
        <button
          class="grid size-10 place-items-center rounded-lg text-[#5e5254] hover:bg-[#faf6f7] lg:hidden"
          type="button"
          (click)="toggleMenu()"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="admin-navigation"
          aria-label="Abrir menú"
        >
          <svg
            aria-hidden="true"
            class="size-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <p class="text-xs text-[#7c8691]"></p>
        <div
          class="-mr-5 flex h-full items-center gap-3 rounded-bl-[2rem] bg-[#a9002d] px-5 text-white sm:-mr-8 sm:gap-4 sm:rounded-bl-[2.5rem] sm:px-8"
        >
          <img class="h-7 w-auto sm:h-9" src="/assets/layout/logo-profile.svg" alt="" />
          <span class="font-[var(--font-geist)] text-lg font-black leading-[120%] sm:text-[28px]"
            >UPRIT IDIOMAS</span
          >
          <button
            class="grid size-8 place-items-center rounded-full hover:bg-white/15 sm:size-10"
            type="button"
            aria-label="Notificaciones"
            (click)="toggleNotifications($event)"
          >
            <img class="h-5 w-auto sm:h-7" src="/assets/layout/notification.svg" alt="" /></button
          ><button
            class="grid size-8 place-items-center rounded-full hover:bg-white/15 sm:size-11"
            type="button"
            aria-label="Ver perfil"
            (click)="toggleProfile($event)"
          >
            <img class="h-7 w-auto sm:h-10" src="/assets/layout/profile.svg" alt="" />
          </button>
        </div>
      </div>
      @if (menuOpen()) {
        <button
          class="fixed inset-0 z-20 bg-black/20"
          type="button"
          (click)="menuOpen.set(false)"
          aria-label="Cerrar menú"
        ></button>
      }
      <aside
        id="admin-navigation"
        class="fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-[#a9002d] pt-24 text-white shadow-2xl transition-transform duration-200 lg:absolute lg:top-20 lg:w-60 lg:translate-x-0 lg:rounded-tr-[4.5rem] lg:pt-8 lg:shadow-none"
        [class.-translate-x-full]="!menuOpen()"
        aria-label="Navegación administrativa"
      >
        <nav class="space-y-1 px-4">
          @for (item of navigation; track item.label) {
            @if (item.route) {
            <a
              [routerLink]="item.route"
              class="flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-semibold hover:bg-white/15"
              [class.bg-white/20]="item.section === section"
              [attr.aria-current]="item.section === section ? 'page' : null"
              (click)="menuOpen.set(false)"
              ><span class="grid size-4 place-items-center">{{ item.icon }}</span
              >{{ item.label }}</a
            >
            } @else {
              <span class="flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-semibold text-white/70" aria-disabled="true">
                <span class="grid size-4 place-items-center">{{ item.icon }}</span>{{ item.label }}
                <span class="ml-auto text-xs font-normal">Próximamente</span>
              </span>
            }
          }
        </nav>
      </aside>
      <section class="px-6 py-8 sm:px-10 sm:py-10 lg:ml-60 lg:px-14 lg:py-12">
        @if (section === 'modules') {
          <app-admin-modules />
        } @else if (section === 'site-create' || section === 'site-edit') {
          <app-admin-site-create />
        } @else if (section === 'sites') {
          <app-admin-sites />
        } @else if (section === 'users') {
          <app-admin-users />
        } @else if (section === 'roles' || section === 'permissions') {
          <app-admin-access-policy [view]="section" />
        } @else {
        <p class="text-xs text-[#7c8691]">Inicio</p>
        <h1
          class="mt-5 font-[var(--font-heading)] text-2xl font-semibold tracking-tight text-[#a9002d] sm:text-3xl"
        >
          Bienvenido a UPRIT IDIOMAS, {{ displayName() }}
        </h1>
        }
      </section>
      <aside
        class="absolute right-0 top-20 z-20 flex min-h-[calc(100dvh-5rem)] w-full max-w-none flex-col rounded-bl-3xl bg-[#eed6db] px-10 py-9 text-[#1e1e1e] shadow-lg transition-transform sm:w-[470px] sm:px-10 sm:py-10"
        [class.translate-x-full]="!profileOpen()"
        aria-label="Perfil de usuario"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center gap-4">
          <img
            class="size-14 shrink-0 sm:size-[58px]"
            src="/assets/layout/menu-profile.svg"
            alt=""
          />
          <p class="font-[var(--font-geist)] text-xl font-semibold leading-[120%] sm:text-2xl">
            {{ displayName() }}
          </p>
        </div>
        <div class="mt-7 flex items-center gap-4">
          <img class="size-14 shrink-0 sm:size-[58px]" src="/assets/layout/menu-logo.svg" alt="" />
          <p class="font-[var(--font-geist)] text-xl font-semibold leading-[120%] sm:text-2xl">
            Universidad Privada de Trujillo - UPRIT
          </p>
        </div>
        <div class="mt-8 h-px bg-white/90"></div>
        <button
          class="mx-auto mt-auto flex h-[68px] w-full max-w-[300px] items-center justify-center gap-3 rounded-full bg-white font-[var(--font-geist)] text-xl font-semibold text-[#a81a39] shadow-sm transition hover:bg-[#fff8f9]"
          type="button"
          (click)="logout()"
        >
          <img class="size-7" src="/assets/layout/logout.svg" alt="" /> Cerrar Sesión
        </button>
      </aside>
      <aside
        class="absolute right-0 top-20 z-20 flex min-h-[calc(100dvh-5rem)] w-full max-w-none flex-col rounded-bl-3xl bg-[#eed6db] px-10 py-9 text-[#1e1e1e] shadow-lg transition-transform sm:w-[470px] sm:px-10 sm:py-10"
        [class.translate-x-full]="!notificationsOpen()"
        aria-label="Notificaciones"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center gap-4">
          <img class="size-14" src="/assets/layout/notification.svg" alt="" />
          <h2 class="font-[var(--font-geist)] text-2xl font-semibold">Notificaciones</h2>
        </div>
        <div class="mt-8 h-px bg-white/90"></div>
        <p class="mt-8 text-center text-base text-[#5e5254]">No tienes notificaciones nuevas.</p>
      </aside>
    </section>
  </main>`,
})
export class AdministratorHomeComponent {
  private readonly session = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
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
      await this.authApi.logout();
    } finally {
      this.session.clear();
      await this.router.navigateByUrl('/login');
    }
  }
}
