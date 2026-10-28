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
export interface TeacherAbsence { readonly id: string; readonly date: string; readonly groupCode: string; readonly status: 'Injustificado' | 'Justificado'; }

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'JUSTIFIED_ABSENCE' | 'LATE';
export interface TeachingStudent { readonly userId: string; readonly code: string; readonly documentNumber: string; readonly name: string; readonly status: AttendanceStatus | null; }
export interface StudentGrade { readonly userId: string; readonly code: string; readonly documentNumber: string; readonly name: string; readonly listeningReading: number | null; readonly writing: number | null; readonly testOne: number | null; readonly participation: number | null; readonly finalTest: number | null; readonly total: number | null; }

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
  async selfAbsences(groupId: string): Promise<readonly TeacherAbsence[]> { const response = await firstValueFrom(this.http.post<unknown>(`${this.url}/groups/${groupId}/self-absences`, {})); const rows = isRecord(response) && Array.isArray(response['absences']) ? response['absences'] : []; return rows.flatMap((row) => isRecord(row) && TEXT(row['id'], 64) && TEXT(row['date'], 16) && TEXT(row['groupCode'], 16) && (row['status'] === 'Injustificado' || row['status'] === 'Justificado') ? [{ id: row['id'], date: row['date'], groupCode: row['groupCode'], status: row['status'] }] : []); }
  async justifySelfAbsence(groupId: string, sessionId: string, reason: string, file: { name: string; contentType: string; base64: string }): Promise<void> { await firstValueFrom(this.http.post(`${this.url}/groups/${groupId}/self-absences/justify`, { sessionId, reason, file })); }

  async roster(groupId: string): Promise<{ date: string; students: readonly TeachingStudent[] }> {
    const response = await firstValueFrom(this.http.post<unknown>(`${this.url}/groups/${groupId}/roster`, {}));
    return { date: isRecord(response) && typeof response['date'] === 'string' ? response['date'] : '', students: this.students(response, true) };
  }

  async saveAttendance(groupId: string, rows: readonly { studentUserId: string; status: AttendanceStatus }[]): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/groups/${groupId}/attendance`, { rows }));
  }

  async attendanceHistory(groupId: string): Promise<readonly { date: string; documentNumber: string; studentName: string; status: AttendanceStatus }[]> {
    const response = await firstValueFrom(this.http.post<unknown>(`${this.url}/groups/${groupId}/attendance/history`, {}));
    const rows = isRecord(response) && Array.isArray(response['rows']) ? response['rows'] : [];
    return rows.flatMap((row) => isRecord(row) && TEXT(row['date'], 16) && TEXT(row['documentNumber'], 16) && TEXT(row['studentName'], 200) && (row['status'] === 'PRESENT' || row['status'] === 'ABSENT' || row['status'] === 'JUSTIFIED_ABSENCE' || row['status'] === 'LATE') ? [{ date: row['date'], documentNumber: row['documentNumber'], studentName: row['studentName'], status: row['status'] }] : []);
  }
  async absences(groupId: string): Promise<readonly { id: string; date: string; documentNumber: string; studentName: string }[]> { const r = await firstValueFrom(this.http.get<unknown>(`${this.url}/groups/${groupId}/absences`)); const rows = isRecord(r) && Array.isArray(r['absences']) ? r['absences'] : []; return rows.flatMap((x) => isRecord(x) && TEXT(x['id'],64) && TEXT(x['date'],16) && TEXT(x['documentNumber'],16) && TEXT(x['studentName'],200) ? [{id:x['id'],date:x['date'],documentNumber:x['documentNumber'],studentName:x['studentName']}] : []); }
  async justifyAbsence(groupId: string, attendanceId: string, reason: string, file?: { name: string; contentType: string; base64: string }): Promise<void> { await firstValueFrom(this.http.post(`${this.url}/groups/${groupId}/absences/justify`, { attendanceId, reason, ...(file ? { file } : {}) })); }

  async grades(groupId: string): Promise<readonly StudentGrade[]> {
    const response = await firstValueFrom(this.http.post<unknown>(`${this.url}/groups/${groupId}/grades/view`, {}));
    return this.students(response, false).flatMap((student) => {
      if (!isRecord(student)) return [];
      const number = (key: string) => typeof student[key] === 'number' ? student[key] : null;
      return [{ ...student, listeningReading: number('listeningReading'), writing: number('writing'), testOne: number('testOne'), participation: number('participation'), finalTest: number('finalTest'), total: number('total') }];
    });
  }

  async saveGrades(groupId: string, rows: readonly Omit<StudentGrade, 'code' | 'documentNumber' | 'name' | 'total'>[]): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/groups/${groupId}/grades`, { rows }));
  }

  private students(response: unknown, includeStatus: boolean): readonly TeachingStudent[] {
    const rows = isRecord(response) && Array.isArray(response['students']) ? response['students'] : [];
    return rows.flatMap((row) => {
      if (!isRecord(row) || !TEXT(row['userId'], 64) || !TEXT(row['code'], 32) || !TEXT(row['documentNumber'], 16) || !TEXT(row['name'], 200)) return [];
      const status = row['status'];
      return [{ userId: row['userId'], code: row['code'], documentNumber: row['documentNumber'], name: row['name'], status: includeStatus && (status === 'PRESENT' || status === 'ABSENT' || status === 'JUSTIFIED_ABSENCE' || status === 'LATE') ? status : null }];
    });
  }
}
