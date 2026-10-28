import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface DirectorTeacher {
  readonly id: string;
  readonly documentNumber: string;
  readonly firstName: string;
  readonly lastNames: string;
  readonly phone: string;
  readonly email: string;
  readonly academicDegree: string;
  readonly password?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const TEXT = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max && !value.includes('<');

@Injectable({ providedIn: 'root' })
export class DirectorTeachersService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/director/teachers';

  async list(): Promise<readonly DirectorTeacher[]> {
    const response = await firstValueFrom(this.http.get<unknown>(this.url));
    const rows = isRecord(response) && Array.isArray(response['teachers']) ? response['teachers'] : [];
    return rows.flatMap((row) => {
      if (!isRecord(row) || typeof row['id'] !== 'string' || !TEXT(row['firstName'], 100)) return [];
      return [{
        id: row['id'],
        documentNumber: typeof row['documentNumber'] === 'string' ? row['documentNumber'] : '',
        firstName: row['firstName'],
        lastNames: typeof row['lastNames'] === 'string' ? row['lastNames'] : '',
        phone: typeof row['phone'] === 'string' ? row['phone'] : '',
        email: typeof row['email'] === 'string' ? row['email'] : '',
        academicDegree: typeof row['academicDegree'] === 'string' ? row['academicDegree'] : '',
      }];
    });
  }

  async save(input: Omit<DirectorTeacher, 'id' | 'password'>, id?: string): Promise<DirectorTeacher | void> {
    if (id) {
      await firstValueFrom(this.http.patch(`${this.url}/${id}`, input));
      return;
    }
    const created = await firstValueFrom(this.http.post<unknown>(this.url, input));
    if (!isRecord(created) || typeof created['id'] !== 'string') throw new Error('No se pudo crear el docente.');
    return {
      id: created['id'],
      documentNumber: input.documentNumber,
      firstName: input.firstName,
      lastNames: input.lastNames,
      phone: input.phone,
      email: input.email,
      academicDegree: input.academicDegree,
      password: typeof created['password'] === 'string' ? created['password'] : '',
    };
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/${id}`));
  }
}
