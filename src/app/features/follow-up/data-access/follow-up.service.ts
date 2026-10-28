import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type GroupStatus = 'APERTURADO' | 'CULMINADO';
export type AbsenceStatus = 'Injustificado' | 'Justificado';

export interface StudentAttendanceAlert {
  readonly studentName: string;
  readonly groupLabel: string;
  readonly absencePercent: number;
}

export interface StudentAttendanceRow {
  readonly id: string;
  readonly code: string;
  readonly documentNumber: string;
  readonly studentName: string;
  readonly language: string;
  readonly level: string;
  readonly groupCode: string;
  readonly groupStatus: GroupStatus;
  readonly absencePercent: number;
}

export interface TeacherAttendanceRow {
  readonly id: string;
  readonly documentNumber: string;
  readonly teacherName: string;
  readonly language: string;
  readonly level: string;
  readonly groupCode: string;
  readonly groupStatus: GroupStatus;
  readonly attendancePercent: number;
}

export interface StudentAbsenceRow {
  readonly id: string;
  readonly occurredOn: string;
  readonly documentNumber: string;
  readonly studentName: string;
  readonly groupCode: string;
  readonly language: string;
  readonly level: string;
  readonly status: AbsenceStatus;
}

export interface AcademicFollowUp {
  readonly absenceLimit: number;
  readonly alerts: readonly StudentAttendanceAlert[];
  readonly students: readonly StudentAttendanceRow[];
  readonly teachers: readonly TeacherAttendanceRow[];
  readonly absences: readonly StudentAbsenceRow[];
}

const TEXT = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max && !value.includes('<');
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const percent = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const isAlert = (value: unknown): value is StudentAttendanceAlert =>
  isRecord(value) && TEXT(value['studentName'], 200) && TEXT(value['groupLabel'], 160) && percent(value['absencePercent']);
const isStudent = (value: unknown): value is StudentAttendanceRow =>
  isRecord(value) && TEXT(value['id'], 64) && TEXT(value['code'], 32) && TEXT(value['documentNumber'], 16) &&
  TEXT(value['studentName'], 200) && TEXT(value['language'], 80) && TEXT(value['level'], 80) && TEXT(value['groupCode'], 16) &&
  (value['groupStatus'] === 'APERTURADO' || value['groupStatus'] === 'CULMINADO') && percent(value['absencePercent']);
const isTeacher = (value: unknown): value is TeacherAttendanceRow =>
  isRecord(value) && TEXT(value['id'], 64) && TEXT(value['documentNumber'], 16) && TEXT(value['teacherName'], 200) &&
  TEXT(value['language'], 80) && TEXT(value['level'], 80) && TEXT(value['groupCode'], 16) &&
  (value['groupStatus'] === 'APERTURADO' || value['groupStatus'] === 'CULMINADO') && percent(value['attendancePercent']);
const isAbsence = (value: unknown): value is StudentAbsenceRow =>
  isRecord(value) && TEXT(value['id'], 64) && TEXT(value['occurredOn'], 32) && TEXT(value['documentNumber'], 16) &&
  TEXT(value['studentName'], 200) && TEXT(value['groupCode'], 16) && TEXT(value['language'], 80) && TEXT(value['level'], 80) &&
  (value['status'] === 'Injustificado' || value['status'] === 'Justificado');
const isOverview = (value: unknown): value is AcademicFollowUp =>
  isRecord(value) && typeof value['absenceLimit'] === 'number' && Number.isInteger(value['absenceLimit']) && value['absenceLimit'] >= 1 && value['absenceLimit'] <= 100 &&
  Array.isArray(value['alerts']) && value['alerts'].every(isAlert) &&
  Array.isArray(value['students']) && value['students'].every(isStudent) &&
  Array.isArray(value['teachers']) && value['teachers'].every(isTeacher) &&
  Array.isArray(value['absences']) && value['absences'].every(isAbsence);

export const absenceTone = (percentValue: number, limit: number): 'green' | 'yellow' | 'orange' | 'red' => {
  if (percentValue >= limit) return 'red';
  if (percentValue >= 16) return 'orange';
  if (percentValue >= 6) return 'yellow';
  return 'green';
};

@Injectable({ providedIn: 'root' })
export class FollowUpService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/advisor/follow-up';

  async read(): Promise<AcademicFollowUp> {
    const response = await firstValueFrom(this.http.get<unknown>(this.url));
    if (!isOverview(response)) throw new Error('La consulta de seguimiento no es válida.');
    return response;
  }
}
