import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface PermissionModule {
  readonly code: string;
  readonly name: string;
}

export interface CatalogFunctionality {
  readonly name: string;
  readonly enabled: boolean;
}

export interface CatalogPermission {
  readonly id: string;
  readonly moduleCode: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly functionalities: readonly CatalogFunctionality[];
}

export interface PermissionPage {
  readonly modules: readonly PermissionModule[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly items: readonly CatalogPermission[];
}

export interface PermissionQuery {
  readonly module?: string;
  readonly search?: string;
  readonly page: number;
  readonly pageSize: 5 | 10 | 20;
}

export interface PermissionChange {
  readonly name?: string;
  readonly enabled?: boolean;
  readonly functionalities?: readonly CatalogFunctionality[];
}

export interface PermissionInput {
  readonly moduleCode: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly functionalities: readonly CatalogFunctionality[];
}

const validId = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const plainText = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 120 && !value.includes('<') && !value.includes('>');
const isModule = (value: unknown): value is PermissionModule => isRecord(value) && typeof value['code'] === 'string' && /^[a-z0-9-]{1,64}$/.test(value['code']) && plainText(value['name']);
const isFunctionality = (value: unknown): value is CatalogFunctionality => isRecord(value) && plainText(value['name']) && typeof value['enabled'] === 'boolean';
const isPermission = (value: unknown): value is CatalogPermission =>
  isRecord(value) && typeof value['id'] === 'string' && validId(value['id']) && typeof value['moduleCode'] === 'string' && /^[a-z0-9-]{1,64}$/.test(value['moduleCode']) &&
  plainText(value['name']) && typeof value['enabled'] === 'boolean' && Array.isArray(value['functionalities']) && value['functionalities'].every(isFunctionality);
const isPage = (value: unknown): value is PermissionPage =>
  isRecord(value) && Array.isArray(value['modules']) && value['modules'].every(isModule) && typeof value['page'] === 'number' &&
  (value['pageSize'] === 5 || value['pageSize'] === 10 || value['pageSize'] === 20) && typeof value['total'] === 'number' &&
  Array.isArray(value['items']) && value['items'].every(isPermission);

@Injectable({ providedIn: 'root' })
export class PermissionCatalogService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/admin/permissions';

  async list(query: PermissionQuery): Promise<PermissionPage> {
    const params: Record<string, string> = { page: String(query.page), pageSize: String(query.pageSize) };
    if (query.module) params['module'] = query.module;
    if (query.search) params['search'] = query.search;
    const response = await firstValueFrom(this.http.get<unknown>(this.url, { params }));
    if (!isPage(response)) throw new Error('La respuesta de permisos no es válida.');
    return response;
  }

  async create(input: PermissionInput): Promise<void> {
    await firstValueFrom(this.http.post<unknown>(this.url, input));
  }

  async update(id: string, change: PermissionChange): Promise<void> {
    if (!validId(id)) throw new Error('Identificador inválido.');
    await firstValueFrom(this.http.patch<unknown>(`${this.url}/${id}`, change));
  }

  async remove(id: string): Promise<void> {
    if (!validId(id)) throw new Error('Identificador inválido.');
    await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
  }
}
