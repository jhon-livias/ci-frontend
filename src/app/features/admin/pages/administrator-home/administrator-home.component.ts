import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuthApiService } from '../../../auth/data-access/auth-api.service';

@Component({
  template: `
    <main class="min-h-dvh bg-[#fcf9fa]">
      <section class="relative min-h-dvh overflow-hidden bg-[#fcf9fa]">
        <div class="relative z-30 flex h-18 items-center justify-between bg-white px-5 sm:h-20 sm:px-8">
          <button class="grid size-10 place-items-center rounded-lg text-[#5e5254] hover:bg-[#faf6f7] lg:hidden" type="button" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen()" aria-controls="admin-navigation" aria-label="Abrir menú"><svg aria-hidden="true" class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
          <p class="text-xs text-[#7c8691]">Inicio</p>
          <div class="-mr-5 flex h-full items-center gap-3 rounded-bl-[2rem] bg-[#a9002d] px-5 text-white sm:-mr-8 sm:rounded-bl-[2.5rem] sm:px-8"><img class="hidden h-7 w-auto sm:block" src="/assets/brand/logo-desktop-light.svg" alt="MIGA UPRIT" /><img class="h-6 w-auto sm:hidden" src="/assets/brand/logo-mobile-light.svg" alt="MIGA UPRIT" /><button class="grid size-8 place-items-center rounded-full bg-white text-[#a9002d]" type="button" aria-label="Ver perfil" (click)="toggleProfile()"><svg aria-hidden="true" class="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10m0 2c-5.33 0-9 2.67-9 6v2h18v-2c0-3.33-3.67-6-9-6"/></svg></button></div>
        </div>
        @if (menuOpen()) { <button class="fixed inset-0 z-20 bg-black/20" type="button" (click)="menuOpen.set(false)" aria-label="Cerrar menú"></button> }
        <aside id="admin-navigation" class="fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-[#a9002d] pt-24 text-white shadow-2xl transition-transform duration-200 lg:absolute lg:top-20 lg:w-60 lg:translate-x-0 lg:rounded-tr-[4.5rem] lg:pt-8 lg:shadow-none" [class.-translate-x-full]="!menuOpen()" aria-label="Navegación administrativa">
          <nav class="space-y-1 px-4">@for (item of navigation; track item.label) { <a href="#" class="flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-semibold hover:bg-white/15" [class.bg-white/20]="item.active" (click)="menuOpen.set(false)"><span class="grid size-4 place-items-center">{{ item.icon }}</span>{{ item.label }}</a> }</nav>
        </aside>
        <section class="px-6 py-8 sm:px-10 sm:py-10 lg:ml-60 lg:px-14 lg:py-12"><p class="text-xs text-[#7c8691]">Inicio</p><h1 class="mt-5 font-[var(--font-heading)] text-2xl font-semibold tracking-tight text-[#a9002d] sm:text-3xl">Bienvenido a MIGA UPRIT, {{ displayName() }}</h1></section>
        <aside class="absolute right-0 top-20 z-20 w-full max-w-sm rounded-bl-3xl bg-[#eed6db] p-5 text-[#1e1e1e] shadow-lg transition-transform sm:w-80" [class.translate-x-full]="!profileOpen()" aria-label="Perfil de usuario">
          <div class="flex items-start gap-3 border-b border-[#a9002d]/15 pb-4"><span class="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#a9002d]">●</span><div><p class="text-xs font-bold leading-5">{{ displayName() }}</p><p class="text-[11px] text-[#5e5254]">Administrador</p></div></div><div class="mt-4 flex items-start gap-3"><span class="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#a9002d]">U</span><p class="text-xs font-semibold leading-4">Universidad Privada de Trujillo - UPRIT</p></div><button class="mt-20 flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-bold text-[#a9002d] shadow-sm" type="button" (click)="logout()">Cerrar sesión</button>
        </aside>
      </section>
    </main>`,
})
export class AdministratorHomeComponent {
  private readonly session = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);
  protected readonly profileOpen = signal(true);
  protected readonly displayName = computed(() => this.session.user()?.displayName || 'Administrador');
  protected readonly navigation = [
    { label: 'Inicio', icon: '⌂', active: true }, { label: 'Módulos', icon: '▦', active: false },
    { label: 'Sedes', icon: '⌖', active: false }, { label: 'Permisos', icon: '▤', active: false },
    { label: 'Tipos de usuario', icon: '♟', active: false }, { label: 'Usuarios', icon: '▧', active: false },
    { label: 'Historial', icon: '▣', active: false },
  ] as const;
  protected toggleMenu(): void { this.menuOpen.update((open) => !open); }
  protected toggleProfile(): void { this.profileOpen.update((open) => !open); }
  protected async logout(): Promise<void> {
    try { await this.authApi.logout(); } finally {
      this.session.clear();
      await this.router.navigateByUrl('/login');
    }
  }
}
