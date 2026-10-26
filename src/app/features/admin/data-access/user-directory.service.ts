import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface DirectoryOption {
  readonly code: string;
  readonly name: string;
}

export interface DirectoryUser {
  readonly id: string;
  readonly documentNumber: string;
  readonly firstName: string;
  readonly paternalLastName: string;
  readonly maternalLastName: string;
  readonly typeName: string;
  readonly roles: readonly string[];
}

export interface UserPage {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly types: readonly DirectoryOption[];
  readonly statuses: readonly DirectoryOption[];
  readonly users: readonly DirectoryUser[];
}

export interface UserGrant {
  readonly permissionId: string;
  readonly name: string;
  readonly enabled: boolean;
}

export interface UserDetail {
  readonly id: string;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly firstName: string;
  readonly paternalLastName: string;
  readonly maternalLastName: string;
  readonly siteId: string;
  readonly phone: string;
  readonly mobileCountry: string;
  readonly mobile: string;
  readonly email: string;
  readonly enabled: boolean;
  readonly grants: readonly UserGrant[];
}

export interface UserInput {
  readonly documentType: string;
  readonly documentNumber: string;
  readonly firstName: string;
  readonly paternalLastName: string;
  readonly maternalLastName: string;
  readonly siteId: string;
  readonly phone?: string;
  readonly mobileCountry: string;
  readonly mobile: string;
  readonly email: string;
  readonly password?: string;
  readonly enabled: boolean;
  readonly grants: readonly UserGrant[];
}

export interface TemporaryPassword {
  readonly username: string;
  readonly password: string;
}

export interface UserQuery {
  readonly search?: string;
  readonly role?: string;
  readonly status?: string;
  readonly siteId?: string;
  readonly page: number;
  readonly pageSize: 5 | 10 | 20;
  readonly sort?: 'document' | 'firstName' | 'paternalLastName' | 'maternalLastName' | 'type';
  readonly direction?: 'asc' | 'desc';
}

const validId = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 120 && !value.includes('<') && !value.includes('>');
const isOption = (value: unknown): value is DirectoryOption => isRecord(value) && typeof value['code'] === 'string' && /^[A-Z_]{1,32}$/.test(value['code']) && text(value['name']) && value['name'].length > 0;
const isGrant = (value: unknown): value is UserGrant =>
  isRecord(value) && typeof value['permissionId'] === 'string' && validId(value['permissionId']) && text(value['name']) && value['name'].length > 0 && typeof value['enabled'] === 'boolean';
const isDetail = (value: unknown): value is UserDetail =>
  isRecord(value) && typeof value['id'] === 'string' && validId(value['id']) &&
  (value['documentType'] === 'DNI' || value['documentType'] === 'CE' || value['documentType'] === 'PASSPORT') &&
  text(value['documentNumber']) && text(value['firstName']) && text(value['paternalLastName']) && text(value['maternalLastName']) &&
  typeof value['siteId'] === 'string' && (value['siteId'] === '' || validId(value['siteId'])) &&
  text(value['phone']) && text(value['mobileCountry']) && text(value['mobile']) && text(value['email']) && value['email'].length > 0 &&
  typeof value['enabled'] === 'boolean' && Array.isArray(value['grants']) && value['grants'].every(isGrant);
const isUser = (value: unknown): value is DirectoryUser =>
  isRecord(value) && typeof value['id'] === 'string' && validId(value['id']) &&
  text(value['documentNumber']) && text(value['firstName']) && text(value['paternalLastName']) &&
  text(value['maternalLastName']) && text(value['typeName']) &&
  Array.isArray(value['roles']) && value['roles'].every((role: unknown) => typeof role === 'string' && /^[A-Z_]{1,32}$/.test(role));
const isTemporaryPassword = (value: unknown): value is TemporaryPassword =>
  isRecord(value) && text(value['username']) && value['username'].length > 0 &&
  typeof value['password'] === 'string' && /^[^<>]{8,72}$/u.test(value['password']);
const isPage = (value: unknown): value is UserPage =>
  isRecord(value) && typeof value['page'] === 'number' && Number.isInteger(value['page']) &&
  (value['pageSize'] === 5 || value['pageSize'] === 10 || value['pageSize'] === 20) &&
  typeof value['total'] === 'number' && Array.isArray(value['types']) && value['types'].every(isOption) &&
  Array.isArray(value['statuses']) && value['statuses'].every(isOption) &&
  Array.isArray(value['users']) && value['users'].every(isUser);

@Injectable({ providedIn: 'root' })
export class UserDirectoryService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/admin/users';

  async list(query: UserQuery): Promise<UserPage> {
    const params: Record<string, string> = { page: String(query.page), pageSize: String(query.pageSize) };
    if (query.search) params['search'] = query.search;
    if (query.role) params['role'] = query.role;
    if (query.status) params['status'] = query.status;
    if (query.siteId) params['siteId'] = query.siteId;
    if (query.sort) params['sort'] = query.sort;
    if (query.direction) params['direction'] = query.direction;
    const response = await firstValueFrom(this.http.get<unknown>(this.url, { params }));
    if (!isPage(response) || response.page !== query.page) throw new Error('La respuesta del directorio no es válida.');
    return response;
  }

  async get(id: string): Promise<UserDetail> {
    if (!validId(id)) throw new Error('Identificador inválido.');
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/${id}`));
    if (!isDetail(response)) throw new Error('La respuesta del usuario no es válida.');
    return response;
  }

  async create(input: UserInput): Promise<void> {
    await firstValueFrom(this.http.post<unknown>(this.url, input));
  }

  async update(id: string, input: UserInput): Promise<void> {
    if (!validId(id)) throw new Error('Identificador inválido.');
    await firstValueFrom(this.http.patch<unknown>(`${this.url}/${id}`, input));
  }

  async resetPassword(id: string): Promise<TemporaryPassword> {
    if (!validId(id)) throw new Error('Identificador inválido.');
    const response = await firstValueFrom(this.http.post<unknown>(`${this.url}/${id}/password-reset`, {}));
    if (!isTemporaryPassword(response)) throw new Error('La respuesta del restablecimiento no es válida.');
    return response;
  }

  async remove(id: string): Promise<void> {
    if (!validId(id)) throw new Error('Identificador inválido.');
    await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
  }

  async requirePasswordChange(id: string, mustChangePassword: boolean): Promise<void> {
    if (!validId(id)) throw new Error('Identificador inválido.');
    await firstValueFrom(this.http.patch<unknown>(`${this.url}/${id}/password-policy`, { mustChangePassword }));
  }
}
