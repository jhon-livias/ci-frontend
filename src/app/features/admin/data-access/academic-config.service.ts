import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export const ACADEMIC_CATALOG_KINDS = ['LANGUAGE', 'LEVEL', 'STUDY_TYPE', 'MODALITY', 'GROUP_TYPE'] as const;
export type AcademicCatalogKind = (typeof ACADEMIC_CATALOG_KINDS)[number];

export interface AcademicCatalogItem {
  readonly id: string;
  readonly name: string;
}

export interface AcademicCatalog {
  readonly kind: AcademicCatalogKind;
  readonly title: string;
  readonly items: readonly AcademicCatalogItem[];
}

export interface AcademicRules {
  readonly minStudents: number;
  readonly maxStudents: number;
  readonly absencePercent: number;
  readonly passingGrade: number;
  readonly evaluationsPerGroup: number;
  readonly maxScorePerEvaluation: number;
}

export interface AcademicSchedule {
  readonly number: number;
  readonly day: string;
  readonly classType: string;
  readonly hours: string;
  readonly owner: string;
}

export interface AcademicConfig {
  readonly catalogs: readonly AcademicCatalog[];
  readonly rules: AcademicRules;
  readonly schedules: readonly AcademicSchedule[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && !value.includes('<');
const integer = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const isKind = (value: unknown): value is AcademicCatalogKind => typeof value === 'string' && ACADEMIC_CATALOG_KINDS.some((kind) => kind === value);
const isItem = (value: unknown): value is AcademicCatalogItem => isRecord(value) && typeof value['id'] === 'string' && UUID.test(value['id']) && text(value['name'], 80);
const isCatalog = (value: unknown): value is AcademicCatalog =>
  isRecord(value) && isKind(value['kind']) && text(value['title'], 40) && Array.isArray(value['items']) && value['items'].length <= 40 && value['items'].every(isItem);
const isRules = (value: unknown): value is AcademicRules =>
  isRecord(value) && integer(value['minStudents'], 0, 500) && integer(value['maxStudents'], 0, 500) && value['minStudents'] <= value['maxStudents'] &&
  integer(value['absencePercent'], 0, 100) && integer(value['passingGrade'], 0, 100) && integer(value['evaluationsPerGroup'], 1, 20) && integer(value['maxScorePerEvaluation'], 1, 100);
const isSchedule = (value: unknown): value is AcademicSchedule =>
  isRecord(value) && integer(value['number'], 1, 999) && text(value['day'], 40) && text(value['classType'], 40) && text(value['hours'], 40) && text(value['owner'], 120);
const isConfig = (value: unknown): value is AcademicConfig =>
  isRecord(value) && Array.isArray(value['catalogs']) && value['catalogs'].length === ACADEMIC_CATALOG_KINDS.length && value['catalogs'].every(isCatalog) &&
  ACADEMIC_CATALOG_KINDS.every((kind) => (value['catalogs'] as unknown[]).some((catalog) => isCatalog(catalog) && catalog.kind === kind)) &&
  isRules(value['rules']) && Array.isArray(value['schedules']) && value['schedules'].every(isSchedule);

@Injectable({ providedIn: 'root' })
export class AcademicConfigService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/admin/academic-config';

  async read(): Promise<AcademicConfig> {
    const response = await firstValueFrom(this.http.get<unknown>(this.url));
    if (!isConfig(response)) throw new Error('La respuesta de la configuración académica no es válida.');
    return response;
  }

  async addItem(kind: AcademicCatalogKind, name: string): Promise<void> {
    await firstValueFrom(this.http.post<unknown>(`${this.url}/items`, { kind, name }));
  }

  async removeItem(id: string): Promise<void> {
    if (!UUID.test(id)) throw new Error('Identificador inválido');
    await firstValueFrom(this.http.delete<void>(`${this.url}/items/${id}`));
  }

  async saveRules(rules: AcademicRules): Promise<void> {
    await firstValueFrom(this.http.put<unknown>(`${this.url}/rules`, rules));
  }
}
