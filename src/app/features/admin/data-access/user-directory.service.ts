import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface DirectoryUser {
  readonly id: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly status: string;
  readonly roles: readonly string[];
}

export interface UserPage {
  readonly page: number;
  readonly hasMore: boolean;
  readonly users: readonly DirectoryUser[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isDirectoryUser = (value: unknown): value is DirectoryUser =>
  isRecord(value) && typeof value['id'] === 'string' && typeof value['username'] === 'string' &&
  (value['displayName'] === null || typeof value['displayName'] === 'string') &&
  typeof value['status'] === 'string' && Array.isArray(value['roles']) &&
  value['roles'].every((role: unknown) => typeof role === 'string');

const isUserPage = (value: unknown): value is UserPage =>
  isRecord(value) && typeof value['page'] === 'number' && Number.isInteger(value['page']) &&
  typeof value['hasMore'] === 'boolean' && Array.isArray(value['users']) && value['users'].every(isDirectoryUser);

@Injectable({ providedIn: 'root' })
export class UserDirectoryService {
  private readonly http = inject(HttpClient);

  async list(page: number): Promise<UserPage> {
    const response = await firstValueFrom(this.http.get<unknown>('/api/v1/auth/admin/users', { params: { page } }));
    if (!isUserPage(response) || response.page !== page) throw new Error('La respuesta del directorio no es válida.');
    return { page: response.page, hasMore: response.hasMore,
      users: response.users.map((user) => ({ ...user, roles: [...user.roles] })) };
  }
}
