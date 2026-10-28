import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const TEXT = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && !value.includes('<');

export interface StudentProfile {
  readonly type: string;
  readonly typeLabel: string;
  readonly faculty: string | null;
  readonly school: string | null;
  readonly career: string | null;
  readonly studentCode: string | null;
}

export interface StudentEnrollment {
  readonly id: string;
  readonly groupId: string;
  readonly groupCode: string;
  readonly language: string;
  readonly level: string;
  readonly modality: string;
  readonly studyType: string;
  readonly schedule: string;
  readonly teacherName: string;
  readonly meetUrl: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: string;
  readonly statusLabel: string;
  readonly enrolledAt: string;
}

export interface StudentPayment {
  readonly id: string;
  readonly correlative: string;
  readonly createdAt: string;
  readonly amount: string;
  readonly detail: string;
  readonly status: string;
  readonly statusLabel: string;
}

export interface StudentExam {
  readonly id: string;
  readonly language: string;
  readonly examDate: string | null;
  readonly modality: string;
  readonly meetUrl: string;
  readonly status: string;
}

export interface OfferedGroup {
  readonly id: string;
  readonly code: string;
  readonly level: string;
  readonly schedule: string;
  readonly teacherName: string;
  readonly modality: string;
  readonly studyType: string;
  readonly statusLabel: string;
  readonly availability: string;
  readonly amount: string | null;
}

export interface StudentWorkspace {
  readonly student: StudentProfile | null;
  readonly languages: readonly string[];
  readonly levels: readonly string[];
  readonly minStudents: number;
  readonly maxStudents: number;
  readonly enrollments: readonly StudentEnrollment[];
  readonly payments: readonly StudentPayment[];
  readonly exams: readonly StudentExam[];
  readonly nextClasses: readonly { code: string; language: string; level: string; schedule: string; meetUrl: string }[];
}

const asEnrollment = (item: unknown): StudentEnrollment | null => {
  if (!isRecord(item) || !TEXT(item['id'], 64) || !TEXT(item['groupCode'], 16)) return null;
  return {
    id: item['id'],
    groupId: typeof item['groupId'] === 'string' ? item['groupId'] : '',
    groupCode: item['groupCode'],
    language: typeof item['language'] === 'string' ? item['language'] : '',
    level: typeof item['level'] === 'string' ? item['level'] : '',
    modality: typeof item['modality'] === 'string' ? item['modality'] : '',
    studyType: typeof item['studyType'] === 'string' ? item['studyType'] : '',
    schedule: typeof item['schedule'] === 'string' ? item['schedule'] : '—',
    teacherName: typeof item['teacherName'] === 'string' ? item['teacherName'] : '',
    meetUrl: typeof item['meetUrl'] === 'string' ? item['meetUrl'] : '',
    startsAt: typeof item['startsAt'] === 'string' ? item['startsAt'] : '',
    endsAt: typeof item['endsAt'] === 'string' ? item['endsAt'] : '',
    status: typeof item['status'] === 'string' ? item['status'] : '',
    statusLabel: typeof item['statusLabel'] === 'string' ? item['statusLabel'] : '',
    enrolledAt: typeof item['enrolledAt'] === 'string' ? item['enrolledAt'] : '',
  };
};

@Injectable({ providedIn: 'root' })
export class StudentWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/student';

  async workspace(): Promise<StudentWorkspace> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/workspace`));
    const catalog = isRecord(response) && isRecord(response['catalog']) ? response['catalog'] : {};
    const student = isRecord(response) && isRecord(response['student']) ? response['student'] : null;
    return {
      student: student ? {
        type: typeof student['type'] === 'string' ? student['type'] : 'EXTERNAL',
        typeLabel: typeof student['typeLabel'] === 'string' ? student['typeLabel'] : 'Externo',
        faculty: typeof student['faculty'] === 'string' ? student['faculty'] : null,
        school: typeof student['school'] === 'string' ? student['school'] : null,
        career: typeof student['career'] === 'string' ? student['career'] : null,
        studentCode: typeof student['studentCode'] === 'string' ? student['studentCode'] : null,
      } : null,
      languages: Array.isArray(catalog['languages']) ? catalog['languages'].filter((item): item is string => typeof item === 'string') : [],
      levels: Array.isArray(catalog['levels']) ? catalog['levels'].filter((item): item is string => typeof item === 'string') : [],
      minStudents: typeof catalog['minStudents'] === 'number' ? catalog['minStudents'] : 0,
      maxStudents: typeof catalog['maxStudents'] === 'number' ? catalog['maxStudents'] : 0,
      enrollments: this.list(response, 'enrollments').flatMap((row) => {
        const item = asEnrollment(row);
        return item ? [item] : [];
      }),
      payments: this.list(response, 'payments').flatMap((row) => {
        if (!isRecord(row) || !TEXT(row['id'], 64) || !TEXT(row['correlative'], 32)) return [];
        return [{
          id: row['id'],
          correlative: row['correlative'],
          createdAt: typeof row['createdAt'] === 'string' ? row['createdAt'] : '',
          amount: typeof row['amount'] === 'string' ? row['amount'] : '',
          detail: typeof row['detail'] === 'string' ? row['detail'] : '',
          status: typeof row['status'] === 'string' ? row['status'] : '',
          statusLabel: typeof row['statusLabel'] === 'string' ? row['statusLabel'] : '',
        }];
      }),
      exams: this.list(response, 'exams').flatMap((row) => {
        if (!isRecord(row) || !TEXT(row['id'], 64)) return [];
        return [{
          id: row['id'],
          language: typeof row['language'] === 'string' ? row['language'] : '',
          examDate: typeof row['examDate'] === 'string' ? row['examDate'] : null,
          modality: typeof row['modality'] === 'string' ? row['modality'] : '',
          meetUrl: typeof row['meetUrl'] === 'string' ? row['meetUrl'] : '',
          status: typeof row['status'] === 'string' ? row['status'] : '',
        }];
      }),
      nextClasses: this.list(response, 'nextClasses').flatMap((row) => {
        if (!isRecord(row) || typeof row['code'] !== 'string') return [];
        return [{
          code: row['code'],
          language: typeof row['language'] === 'string' ? row['language'] : '',
          level: typeof row['level'] === 'string' ? row['level'] : '',
          schedule: typeof row['schedule'] === 'string' ? row['schedule'] : '',
          meetUrl: typeof row['meetUrl'] === 'string' ? row['meetUrl'] : '',
        }];
      }),
    };
  }

  async groups(language: string): Promise<{
    last: StudentEnrollment | null;
    nextLevel: string | null;
    blocked: boolean;
    minStudents: number;
    maxStudents: number;
    groups: readonly OfferedGroup[];
  }> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/groups`, { params: { language } }));
    const last = isRecord(response) ? asEnrollment(response['last']) : null;
    return {
      last,
      nextLevel: isRecord(response) && typeof response['nextLevel'] === 'string' ? response['nextLevel'] : null,
      blocked: isRecord(response) && response['blocked'] === true,
      minStudents: isRecord(response) && typeof response['minStudents'] === 'number' ? response['minStudents'] : 0,
      maxStudents: isRecord(response) && typeof response['maxStudents'] === 'number' ? response['maxStudents'] : 0,
      groups: this.list(response, 'groups').flatMap((row) => {
        if (!isRecord(row) || !TEXT(row['id'], 64) || !TEXT(row['code'], 16)) return [];
        return [{
          id: row['id'],
          code: row['code'],
          level: typeof row['level'] === 'string' ? row['level'] : '',
          schedule: typeof row['schedule'] === 'string' ? row['schedule'] : '—',
          teacherName: typeof row['teacherName'] === 'string' ? row['teacherName'] : 'Por asignar',
          modality: typeof row['modality'] === 'string' ? row['modality'] : '',
          studyType: typeof row['studyType'] === 'string' ? row['studyType'] : '',
          statusLabel: typeof row['statusLabel'] === 'string' ? row['statusLabel'] : '',
          availability: typeof row['availability'] === 'string' ? row['availability'] : '',
          amount: typeof row['amount'] === 'string' ? row['amount'] : null,
        }];
      }),
    };
  }

  async enroll(groupId: string): Promise<string> {
    const response = await firstValueFrom(this.http.post<unknown>(`${this.url}/enroll`, { groupId, acceptedTerms: true }));
    return isRecord(response) && typeof response['notice'] === 'string' ? response['notice'] : 'Solicitud registrada.';
  }

  async wait(groupId: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/groups/${groupId}/wait`, {}));
  }

  async examInfo(language = ''): Promise<{ upcoming: string | null; amount: string | null }> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/exams`, language ? { params: { language } } : {}));
    const upcoming = isRecord(response) && isRecord(response['upcoming']) && typeof response['upcoming']['startsAt'] === 'string'
      ? response['upcoming']['startsAt']
      : null;
    return { upcoming, amount: isRecord(response) && typeof response['amount'] === 'string' ? response['amount'] : null };
  }

  async registerExam(language: string): Promise<{ notice: string; exam: StudentExam | null; documentNumber: string; name: string }> {
    const response = await firstValueFrom(this.http.post<unknown>(`${this.url}/exams`, { language, acceptedTerms: true }));
    const exam = isRecord(response) ? response['exam'] : null;
    const student = isRecord(response) && isRecord(response['student']) ? response['student'] : {};
    const parsed = exam && isRecord(exam) && TEXT(exam['id'], 64) ? {
      id: exam['id'],
      language: typeof exam['language'] === 'string' ? exam['language'] : language,
      examDate: typeof exam['examDate'] === 'string' ? exam['examDate'] : null,
      modality: typeof exam['modality'] === 'string' ? exam['modality'] : '',
      meetUrl: typeof exam['meetUrl'] === 'string' ? exam['meetUrl'] : '',
      status: typeof exam['status'] === 'string' ? exam['status'] : '',
    } : null;
    return {
      notice: isRecord(response) && typeof response['notice'] === 'string' ? response['notice'] : 'Solicitud registrada.',
      exam: parsed,
      documentNumber: typeof student['documentNumber'] === 'string' ? student['documentNumber'] : '',
      name: typeof student['name'] === 'string' ? student['name'] : '',
    };
  }

  private list(body: unknown, key: string): unknown[] {
    return isRecord(body) && Array.isArray(body[key]) ? body[key] : [];
  }
}
