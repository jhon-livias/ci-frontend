import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthApiService, type AuthSessionSnapshot } from '../../features/auth/data-access/auth-api.service';
import type { ApplicationRole, AuthenticatedUser } from '../../features/auth/models/authenticated-user.model';

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

  hasRole(role: ApplicationRole): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  /** Ruta de entrada única, resuelta a partir de la sesión ya validada. */
  defaultRoute(): string {
    if (!this.isAuthenticated()) {
      return '/login';
    }

    return '/inicio';
  }

  async restore(): Promise<void> {
    try {
      this.start(await this.authApi.session());
    } catch {
      try {
        this.start(await this.authApi.refresh());
      } catch {
        this.clear();
      }
    }
  }
}
