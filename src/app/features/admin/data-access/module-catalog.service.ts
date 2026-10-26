import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface DirectoryModule {
  readonly code: string;
  readonly name: string;
  readonly users: number;
  readonly active: number;
  readonly inactive: number;
}

export interface ModulePage {
  readonly page: number;
  readonly pageSize: 5 | 10 | 20;
  readonly total: number;
  readonly modules: readonly DirectoryModule[];
}

export interface ModuleQuery {
  readonly search?: string;
  readonly occupied?: boolean;
  readonly page: number;
  readonly pageSize: 5 | 10 | 20;
  readonly sort?: 'name' | 'users' | 'active' | 'inactive';
  readonly direction?: 'asc' | 'desc';
}

const MODULE_CODES = ['TEACHER', 'STUDENT', 'ADVISOR', 'DIRECTOR', 'ADMINISTRATOR'] as const;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const count = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1_000_000;
const isModule = (value: unknown): value is DirectoryModule =>
  isRecord(value) && typeof value['code'] === 'string' && MODULE_CODES.includes(value['code'] as typeof MODULE_CODES[number]) &&
  typeof value['name'] === 'string' && value['name'].length > 0 && value['name'].length <= 40 && !value['name'].includes('<') &&
  count(value['users']) && count(value['active']) && count(value['inactive']) && value['users'] === value['active'] + value['inactive'];
const isPage = (value: unknown): value is ModulePage =>
  isRecord(value) && typeof value['page'] === 'number' && (value['pageSize'] === 5 || value['pageSize'] === 10 || value['pageSize'] === 20) &&
  typeof value['total'] === 'number' && Array.isArray(value['modules']) && value['modules'].every(isModule);

@Injectable({ providedIn: 'root' })
export class ModuleCatalogService {
  private readonly http = inject(HttpClient);

  async list(query: ModuleQuery): Promise<ModulePage> {
    const params: Record<string, string> = { page: String(query.page), pageSize: String(query.pageSize) };
    if (query.search) params['search'] = query.search;
    if (query.occupied) params['occupied'] = 'true';
    if (query.sort) params['sort'] = query.sort;
    if (query.direction) params['direction'] = query.direction;
    const response = await firstValueFrom(this.http.get<unknown>('/api/v1/auth/admin/modules', { params }));
    if (!isPage(response) || response.page !== query.page) throw new Error('La respuesta del catálogo no es válida.');
    return response;
  }
}
