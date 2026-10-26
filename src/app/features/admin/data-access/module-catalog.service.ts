import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type ModuleStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETE';
export interface SystemModule {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly status: ModuleStatus;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSystemModule = (value: unknown): value is SystemModule =>
  isRecord(value) && typeof value['code'] === 'string' && typeof value['name'] === 'string' &&
  typeof value['description'] === 'string' &&
  (value['status'] === 'PLANNED' || value['status'] === 'IN_PROGRESS' || value['status'] === 'COMPLETE');

@Injectable({ providedIn: 'root' })
export class ModuleCatalogService {
  private readonly http = inject(HttpClient);

  async list(): Promise<readonly SystemModule[]> {
    const response = await firstValueFrom(this.http.get<unknown>('/api/v1/auth/admin/modules'));
    if (!isRecord(response) || !Array.isArray(response['modules']) || !response['modules'].every(isSystemModule)) {
      throw new Error('La respuesta del catálogo no es válida.');
    }
    const modules: readonly SystemModule[] = response['modules'];
    if (new Set(modules.map((module) => module.code)).size !== modules.length) {
      throw new Error('El catálogo contiene códigos repetidos.');
    }
    return modules.map((module) => ({ ...module }));
  }
}
