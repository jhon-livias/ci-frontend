import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AccessRole {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly string[];
}

export interface AccessPermission {
  readonly code: string;
  readonly description: string;
}

export interface AccessPolicy {
  readonly roles: readonly AccessRole[];
  readonly permissions: readonly AccessPermission[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isRole = (value: unknown): value is AccessRole =>
  isRecord(value) && typeof value['code'] === 'string' && typeof value['name'] === 'string' &&
  typeof value['description'] === 'string' && Array.isArray(value['permissions']) &&
  value['permissions'].every((permission: unknown) => typeof permission === 'string');

const isPermission = (value: unknown): value is AccessPermission =>
  isRecord(value) && typeof value['code'] === 'string' && typeof value['description'] === 'string';

const isPolicy = (value: unknown): value is AccessPolicy =>
  isRecord(value) && Array.isArray(value['roles']) && value['roles'].every(isRole) &&
  Array.isArray(value['permissions']) && value['permissions'].every(isPermission);

@Injectable({ providedIn: 'root' })
export class AccessPolicyService {
  private readonly http = inject(HttpClient);

  async read(): Promise<AccessPolicy> {
    const response = await firstValueFrom(this.http.get<unknown>('/api/v1/auth/access-policy'));
    if (!isPolicy(response)) throw new Error('La política recibida no tiene un formato válido.');
    return { roles: response.roles.map((role) => ({ ...role, permissions: [...role.permissions] })),
      permissions: response.permissions.map((permission) => ({ ...permission })) };
  }
}
