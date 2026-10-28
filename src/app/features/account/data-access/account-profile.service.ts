import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AccountProfile {
  readonly firstName: string;
  readonly paternalLastName: string;
  readonly maternalLastName: string;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly gender: string;
  readonly birthDate: string;
  readonly maritalStatus: string;
  readonly mobileCountry: string;
  readonly mobile: string;
  readonly personalEmail: string;
  readonly email: string;
  readonly address: string;
  readonly siteId: string;
  readonly typeName: string;
  readonly statusName: string;
  readonly username: string;
}

export interface AccountProfileUpdate {
  readonly gender: string;
  readonly birthDate: string;
  readonly maritalStatus: string;
  readonly mobileCountry: string;
  readonly mobile: string;
  readonly personalEmail: string;
  readonly address: string;
}

const isProfile = (value: unknown): value is AccountProfile => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return [
    'firstName', 'paternalLastName', 'maternalLastName', 'documentType', 'documentNumber',
    'gender', 'birthDate', 'maritalStatus', 'mobileCountry', 'mobile', 'personalEmail',
    'email', 'address', 'siteId', 'typeName', 'statusName', 'username',
  ].every((key) => typeof record[key] === 'string');
};

@Injectable({ providedIn: 'root' })
export class AccountProfileService {
  private readonly http = inject(HttpClient);

  async get(): Promise<AccountProfile> {
    const result = await firstValueFrom(this.http.get<unknown>('/api/v1/auth/profile'));
    if (!isProfile(result)) throw new Error('Respuesta inválida');
    return result;
  }

  async update(draft: AccountProfileUpdate): Promise<AccountProfile> {
    const result = await firstValueFrom(this.http.patch<unknown>('/api/v1/auth/profile', draft));
    if (!isProfile(result)) throw new Error('Respuesta inválida');
    return result;
  }

  message(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.message;
      if (typeof message === 'string' && message.length > 0 && message.length < 180) return message;
      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) return 'Revisa los datos marcados.';
    }
    return fallback;
  }
}
