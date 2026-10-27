import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthApiService, type AuthSessionSnapshot } from './auth-api.service';
import type { ApplicationRole, AuthenticatedUser } from './authenticated-user.model';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  readonly user = signal<AuthenticatedUser | null>(null);
  readonly csrfToken = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);

  start(session: AuthSessionSnapshot): void {
    this.user.set(session.user);
    this.csrfToken.set(session.csrfToken);
  }

  clear(): void {
    this.user.set(null);
    this.csrfToken.set(null);
  }

  async logout(): Promise<void> {
    try {
      await this.authApi.logout();
    } finally {
      this.clear();
    }
  }

  hasRole(role: ApplicationRole): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  passwordChanged(): void {
    const current = this.user();
    if (!current) return;
    this.user.set({ ...current, mustChangePassword: false });
  }

  /** Ruta de entrada única, resuelta a partir de la sesión ya validada. */
  defaultRoute(): string {
    if (!this.isAuthenticated()) {
      return '/login';
    }

    if (this.user()?.mustChangePassword) {
      return '/cambiar-contrasena';
    }

    return '/inicio';
  }

  async restore(): Promise<void> {
    try {
      const current = await this.authApi.session();
      if (current) {
        this.start(current);
        return;
      }
    } catch {
      // La cookie de acceso existe, pero ya no es válida.
    }
    try {
      const refreshed = await this.authApi.refresh();
      if (refreshed) {
        this.start(refreshed);
        return;
      }
    } catch {
      // La cookie de renovación existe, pero ya no es válida.
    }
    this.clear();
  }
}
