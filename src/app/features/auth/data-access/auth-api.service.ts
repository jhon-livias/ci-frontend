import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthenticatedUser, type ApplicationRole } from '../models/authenticated-user.model';
import type { LoginCredentials } from '../models/login-credentials.model';

interface LoginResponseDto {
  readonly csrfToken: string;
  readonly user: {
    readonly id: string;
    readonly username: string;
    readonly roles: readonly string[];
    readonly profile: { readonly firstName: string; readonly paternalLastName: string } | null;
  };
}

export interface AuthSessionSnapshot {
  readonly user: AuthenticatedUser;
  readonly csrfToken: string;
}

const applicationRoles: readonly ApplicationRole[] = ['STUDENT', 'TEACHER', 'ADVISOR', 'DIRECTOR', 'ADMINISTRATOR'];

const isLoginResponseDto = (value: unknown): value is LoginResponseDto => {
  if (!value || typeof value !== 'object') return false;
  const user = (value as { user?: unknown }).user;
  if (!user || typeof user !== 'object') return false;
  const candidate = user as Record<string, unknown>;
  const profile = candidate['profile'];
  const validProfile =
    profile === null ||
    (typeof profile === 'object' &&
      profile !== null &&
      typeof (profile as Record<string, unknown>)['firstName'] === 'string' &&
      typeof (profile as Record<string, unknown>)['paternalLastName'] === 'string');
  return (
    typeof (value as Record<string, unknown>)['csrfToken'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['username'] === 'string' &&
    Array.isArray(candidate['roles']) &&
    candidate['roles'].every((role) => typeof role === 'string') &&
    validProfile
  );
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  async login(credentials: LoginCredentials): Promise<AuthSessionSnapshot> {
    const response = await firstValueFrom(
      this.http.post<unknown>('/api/v1/auth/login', credentials, { withCredentials: true }),
    );

    if (!isLoginResponseDto(response)) {
      throw new Error('La respuesta de autenticación no tiene un formato válido.');
    }

    const roles = response.user.roles.filter((role): role is ApplicationRole => applicationRoles.includes(role as ApplicationRole));
    if (roles.length !== response.user.roles.length) {
      throw new Error('La respuesta de autenticación contiene un rol no reconocido.');
    }

    const profile = response.user.profile;
    return { csrfToken: response.csrfToken, user: {
      id: response.user.id,
      username: response.user.username,
      roles,
      displayName: profile ? `${profile.firstName} ${profile.paternalLastName}` : null,
    }};
  }

  async session(): Promise<AuthSessionSnapshot> {
    const response = await firstValueFrom(this.http.get<unknown>('/api/v1/auth/session', { withCredentials: true }));
    return this.toSession(response);
  }

  async refresh(): Promise<AuthSessionSnapshot> {
    const response = await firstValueFrom(this.http.post<unknown>('/api/v1/auth/refresh', {}, { withCredentials: true }));
    return this.toSession(response);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/v1/auth/logout', {}, { withCredentials: true }));
  }

  private toSession(response: unknown): AuthSessionSnapshot {
    if (!isLoginResponseDto(response)) throw new Error('La respuesta de autenticación no tiene un formato válido.');
    const roles = response.user.roles.filter((role): role is ApplicationRole => applicationRoles.includes(role as ApplicationRole));
    if (roles.length !== response.user.roles.length) throw new Error('La respuesta de autenticación contiene un rol no reconocido.');
    const profile = response.user.profile;
    return { csrfToken: response.csrfToken, user: {
      id: response.user.id, username: response.user.username, roles,
      displayName: profile ? `${profile.firstName} ${profile.paternalLastName}` : null,
    }};
  }
}
