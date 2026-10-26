import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface UserTypeModule {
  readonly code: string;
  readonly name: string;
}

export interface UserTypeAccess {
  readonly code: string;
  readonly name: string;
  readonly enabled: boolean;
}

export interface CatalogUserType {
  readonly id: string;
  readonly name: string;
  readonly moduleCode: string;
  readonly moduleName: string;
  readonly enabled: boolean;
  readonly permissions: readonly string[];
  readonly access: readonly UserTypeAccess[];
}

export interface UserTypePermissionOption {
  readonly id: string;
  readonly name: string;
}

export interface UserTypePage {
  readonly modules: readonly UserTypeModule[];
  readonly catalog: readonly UserTypePermissionOption[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly items: readonly CatalogUserType[];
}

export interface UserTypeQuery {
  readonly search?: string;
  readonly page: number;
  readonly pageSize: 5 | 10 | 20;
}

export interface UserTypeChange {
  readonly name?: string;
  readonly enabled?: boolean;
  readonly permissions?: readonly { readonly id: string; readonly enabled: boolean }[];
}

export interface UserTypeInput {
  readonly name: string;
  readonly permissions: readonly { readonly id: string; readonly enabled: boolean }[];
}

const validId = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const plainText = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 120 && !value.includes('<') && !value.includes('>');
const isModule = (value: unknown): value is UserTypeModule => isRecord(value) && typeof value['code'] === 'string' && /^[a-z0-9-]{1,64}$/.test(value['code']) && plainText(value['name']);
const isPermissionOption = (value: unknown): value is UserTypePermissionOption => isRecord(value) && typeof value['id'] === 'string' && validId(value['id']) && plainText(value['name']);
const isAccess = (value: unknown): value is UserTypeAccess =>
  isRecord(value) && typeof value['code'] === 'string' && /^[a-z0-9-]{1,64}$/.test(value['code']) && plainText(value['name']) && typeof value['enabled'] === 'boolean';
const isUserType = (value: unknown): value is CatalogUserType =>
  isRecord(value) && typeof value['id'] === 'string' && validId(value['id']) && plainText(value['name']) &&
  typeof value['moduleCode'] === 'string' && /^[a-z0-9-]{1,64}$/.test(value['moduleCode']) && plainText(value['moduleName']) &&
  typeof value['enabled'] === 'boolean' && Array.isArray(value['permissions']) && value['permissions'].every(plainText) &&
  Array.isArray(value['access']) && value['access'].every(isAccess);
const isPage = (value: unknown): value is UserTypePage =>
  isRecord(value) && Array.isArray(value['modules']) && value['modules'].every(isModule) &&
  Array.isArray(value['catalog']) && value['catalog'].every(isPermissionOption) && typeof value['page'] === 'number' &&
  (value['pageSize'] === 5 || value['pageSize'] === 10 || value['pageSize'] === 20) && typeof value['total'] === 'number' &&
  Array.isArray(value['items']) && value['items'].every(isUserType);

@Injectable({ providedIn: 'root' })
export class UserTypeCatalogService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/admin/user-types';

  async list(query: UserTypeQuery): Promise<UserTypePage> {
    const params: Record<string, string> = { page: String(query.page), pageSize: String(query.pageSize) };
    if (query.search) params['search'] = query.search;
    const response = await firstValueFrom(this.http.get<unknown>(this.url, { params }));
    if (!isPage(response)) throw new Error('La respuesta de tipos de usuario no es válida.');
    return response;
  }

  async create(input: UserTypeInput): Promise<void> {
    await firstValueFrom(this.http.post<unknown>(this.url, input));
  }

  async update(id: string, change: UserTypeChange): Promise<void> {
    if (!validId(id)) throw new Error('Identificador inválido.');
    await firstValueFrom(this.http.patch<unknown>(`${this.url}/${id}`, change));
  }

  async remove(id: string): Promise<void> {
    if (!validId(id)) throw new Error('Identificador inválido.');
    await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
  }
}
