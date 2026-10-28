import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface CatalogItem { readonly id: string; readonly name: string }
export interface Catalog { readonly kind: string; readonly title: string; readonly items: readonly CatalogItem[] }
export interface ScheduleSlotView {
  readonly day: string;
  readonly classKind: string;
  readonly classType: string;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly hours: string;
}
export interface ScheduleCombo {
  readonly id: string;
  readonly number: number;
  readonly days: string;
  readonly classTypes: string;
  readonly hours: string;
  readonly dayLabel: string;
  readonly hourLabel: string;
  readonly slots: readonly ScheduleSlotView[];
}
export interface AcademicGroup {
  readonly id: string;
  readonly code: string;
  readonly kind: 'CLASSES' | 'PROFICIENCY';
  readonly kindLabel: string;
  readonly status: 'CREATED' | 'RESCHEDULED' | 'OPENED' | 'COMPLETED';
  readonly statusLabel: string;
  readonly language: string;
  readonly level: string;
  readonly modality: string;
  readonly studyType: string;
  readonly meetUrl: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly teacherUserId: string;
  readonly teacherDocument: string;
  readonly teacherName: string;
  readonly dayComboId: string | null;
  readonly hourComboId: string | null;
  readonly schedule: string;
  readonly enrolledCount: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const TEXT = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && !value.includes('<');

@Injectable({ providedIn: 'root' })
export class DirectorOperationsService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/director';

  async catalogs(): Promise<readonly Catalog[]> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/catalogs`));
    const catalogs = isRecord(response) && Array.isArray(response['catalogs']) ? response['catalogs'] : [];
    return catalogs.flatMap((item) => {
      if (!isRecord(item) || typeof item['kind'] !== 'string' || !Array.isArray(item['items'])) return [];
      return [{
        kind: item['kind'],
        title: typeof item['title'] === 'string' ? item['title'] : item['kind'],
        items: item['items'].flatMap((row) => isRecord(row) && TEXT(row['id'], 64) && TEXT(row['name'], 80) ? [{ id: row['id'], name: row['name'] }] : []),
      }];
    });
  }

  async schedules(): Promise<readonly ScheduleCombo[]> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/schedules`));
    const combos = isRecord(response) && Array.isArray(response['combos']) ? response['combos'] : [];
    return combos.filter((item): item is ScheduleCombo => isRecord(item) && TEXT(item['id'], 64) && typeof item['number'] === 'number');
  }

  async createSchedule(slots: readonly { day: string; classKind: string; startMinutes: number; endMinutes: number }[]): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/schedules`, { slots }));
  }

  async removeSchedule(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/schedules/${id}`));
  }

  async groups(): Promise<readonly AcademicGroup[]> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/groups`));
    const groups = isRecord(response) && Array.isArray(response['groups']) ? response['groups'] : [];
    return groups.filter((item): item is AcademicGroup => isRecord(item) && TEXT(item['id'], 64) && TEXT(item['code'], 16));
  }

  async saveGroup(body: Record<string, unknown>, id?: string): Promise<void> {
    if (id) await firstValueFrom(this.http.patch(`${this.url}/groups/${id}`, body));
    else await firstValueFrom(this.http.post(`${this.url}/groups`, body));
  }

  async reschedule(id: string, startsAt: string, endsAt: string): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.url}/groups/${id}/reschedule`, { startsAt, endsAt }));
  }
}
