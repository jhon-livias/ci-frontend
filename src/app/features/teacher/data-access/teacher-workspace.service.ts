import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface TeachingSlot {
  readonly day: string;
  readonly classKind: string;
  readonly startMinutes: number;
  readonly endMinutes: number;
}

export interface TeachingGroup {
  readonly id: string;
  readonly code: string;
  readonly language: string;
  readonly level: string;
  readonly studyType: string;
  readonly modality: string;
  readonly meetUrl: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: 'CREATED' | 'RESCHEDULED' | 'OPENED' | 'COMPLETED';
  readonly statusLabel: string;
  readonly schedule: string;
  readonly slots: readonly TeachingSlot[];
}

export interface TeacherSession {
  readonly id: string;
  readonly sessionDate: string;
  readonly classType: string;
  readonly hours: string;
  readonly checkInAt: string | null;
  readonly checkOutAt: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const TEXT = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && !value.includes('<');

const asGroup = (item: unknown): TeachingGroup | null => {
  if (!isRecord(item) || !TEXT(item['id'], 64) || !TEXT(item['code'], 16)) return null;
  const status = item['status'];
  if (status !== 'CREATED' && status !== 'RESCHEDULED' && status !== 'OPENED' && status !== 'COMPLETED') return null;
  const slots = Array.isArray(item['slots']) ? item['slots'] : [];
  return {
    id: item['id'],
    code: item['code'],
    language: typeof item['language'] === 'string' ? item['language'] : '',
    level: typeof item['level'] === 'string' ? item['level'] : '',
    studyType: typeof item['studyType'] === 'string' ? item['studyType'] : '',
    modality: typeof item['modality'] === 'string' ? item['modality'] : '',
    meetUrl: typeof item['meetUrl'] === 'string' ? item['meetUrl'] : '',
    startsAt: typeof item['startsAt'] === 'string' ? item['startsAt'] : '',
    endsAt: typeof item['endsAt'] === 'string' ? item['endsAt'] : '',
    status,
    statusLabel: typeof item['statusLabel'] === 'string' ? item['statusLabel'] : status,
    schedule: typeof item['schedule'] === 'string' ? item['schedule'] : '—',
    slots: slots.flatMap((slot) => {
      if (!isRecord(slot) || typeof slot['day'] !== 'string') return [];
      return [{
        day: slot['day'],
        classKind: typeof slot['classKind'] === 'string' ? slot['classKind'] : 'SYNCHRONOUS',
        startMinutes: typeof slot['startMinutes'] === 'number' ? slot['startMinutes'] : 0,
        endMinutes: typeof slot['endMinutes'] === 'number' ? slot['endMinutes'] : 0,
      }];
    }),
  };
};

@Injectable({ providedIn: 'root' })
export class TeacherWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/teacher';

  async groups(): Promise<readonly TeachingGroup[]> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/groups`));
    const rows = isRecord(response) && Array.isArray(response['groups']) ? response['groups'] : [];
    return rows.flatMap((row) => {
      const group = asGroup(row);
      return group ? [group] : [];
    });
  }

  async sessions(groupId: string): Promise<readonly TeacherSession[]> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/groups/${groupId}/sessions`));
    const rows = isRecord(response) && Array.isArray(response['sessions']) ? response['sessions'] : [];
    return rows.flatMap((row) => {
      if (!isRecord(row) || !TEXT(row['id'], 64) || !TEXT(row['sessionDate'], 32)) return [];
      return [{
        id: row['id'],
        sessionDate: row['sessionDate'],
        classType: typeof row['classType'] === 'string' ? row['classType'] : '',
        hours: typeof row['hours'] === 'string' ? row['hours'] : '',
        checkInAt: typeof row['checkInAt'] === 'string' ? row['checkInAt'] : null,
        checkOutAt: typeof row['checkOutAt'] === 'string' ? row['checkOutAt'] : null,
      }];
    });
  }

  async checkIn(groupId: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/groups/${groupId}/check-in`, {}));
  }

  async checkOut(groupId: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/groups/${groupId}/check-out`, {}));
  }
}
