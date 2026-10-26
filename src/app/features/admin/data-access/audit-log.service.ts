import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export const AUDIT_ROLES = ['Estudiante', 'Docente', 'Asesora', 'Director', 'Administrador'] as const;
export const AUDIT_MODULES = ['Sesión', 'Usuarios', 'Tipos de usuario', 'Permisos', 'Sedes', 'Configuración académica'] as const;

export interface AuditEvent {
  readonly id: string;
  readonly occurredAt: string;
  readonly actorName: string;
  readonly actorRole: (typeof AUDIT_ROLES)[number];
  readonly module: (typeof AUDIT_MODULES)[number];
  readonly action: string;
}

export interface AuditPage {
  readonly page: number;
  readonly pageSize: 5 | 10 | 20;
  readonly total: number;
  readonly roles: readonly string[];
  readonly modules: readonly string[];
  readonly events: readonly AuditEvent[];
}

export interface AuditQuery {
  readonly search?: string;
  readonly role?: (typeof AUDIT_ROLES)[number];
  readonly module?: (typeof AUDIT_MODULES)[number];
  readonly page: number;
  readonly pageSize: 5 | 10 | 20;
  readonly sort?: 'occurredAt' | 'actorName' | 'actorRole' | 'module' | 'action';
  readonly direction?: 'asc' | 'desc';
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const WHEN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && !value.includes('<');
const isRole = (value: unknown): value is AuditEvent['actorRole'] => typeof value === 'string' && AUDIT_ROLES.some((role) => role === value);
const isModule = (value: unknown): value is AuditEvent['module'] => typeof value === 'string' && AUDIT_MODULES.some((module) => module === value);
const isEvent = (value: unknown): value is AuditEvent =>
  isRecord(value) && typeof value['id'] === 'string' && UUID.test(value['id']) && typeof value['occurredAt'] === 'string' && WHEN.test(value['occurredAt']) &&
  text(value['actorName'], 200) && isRole(value['actorRole']) && isModule(value['module']) && text(value['action'], 240);
const sameList = (value: unknown, expected: readonly string[]): value is readonly string[] =>
  Array.isArray(value) && value.length === expected.length && expected.every((item) => value.includes(item));
const isPage = (value: unknown): value is AuditPage =>
  isRecord(value) && typeof value['page'] === 'number' && (value['pageSize'] === 5 || value['pageSize'] === 10 || value['pageSize'] === 20) &&
  typeof value['total'] === 'number' && Number.isInteger(value['total']) && value['total'] >= 0 &&
  sameList(value['roles'], AUDIT_ROLES) && sameList(value['modules'], AUDIT_MODULES) &&
  Array.isArray(value['events']) && value['events'].every(isEvent);

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);

  async list(query: AuditQuery): Promise<AuditPage> {
    const params: Record<string, string> = { page: String(query.page), pageSize: String(query.pageSize) };
    if (query.search) params['search'] = query.search;
    if (query.role) params['role'] = query.role;
    if (query.module) params['module'] = query.module;
    if (query.sort) params['sort'] = query.sort;
    if (query.direction) params['direction'] = query.direction;
    const response = await firstValueFrom(this.http.get<unknown>('/api/v1/auth/admin/audit', { params }));
    if (!isPage(response) || response.page !== query.page) throw new Error('La respuesta del historial no es válida.');
    return response;
  }
}
