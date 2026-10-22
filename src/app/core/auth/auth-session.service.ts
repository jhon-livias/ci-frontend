import { Injectable, computed, signal } from '@angular/core';

import type { ApplicationRole, AuthenticatedUser } from '../../features/auth/models/authenticated-user.model';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly user = signal<AuthenticatedUser | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);

  start(user: AuthenticatedUser): void {
    this.user.set(user);
  }

  clear(): void {
    this.user.set(null);
  }

  hasRole(role: ApplicationRole): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }
}
