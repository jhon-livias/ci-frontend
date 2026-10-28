import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface EnrollmentTariff {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly amountCents: number;
  readonly amount: string;
}

export interface PaymentIncident {
  readonly id: string;
  readonly occurredAt: string;
  readonly studentName: string;
  readonly concept: string;
  readonly error: string;
  readonly status: 'Pendiente' | 'Resuelta';
}

export interface PaymentsOverview {
  readonly tariffs: readonly EnrollmentTariff[];
  readonly incidents: readonly PaymentIncident[];
  readonly pendingIncidents: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const WHEN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u;
const AMOUNT = /^\d{1,5}\.\d{2}$/u;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && !value.includes('<');
const cents = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9_999_999;
const isTariff = (value: unknown): value is EnrollmentTariff =>
  isRecord(value) && typeof value['id'] === 'string' && UUID.test(value['id']) && text(value['code'], 32) && text(value['name'], 120) &&
  cents(value['amountCents']) && typeof value['amount'] === 'string' && AMOUNT.test(value['amount']);
const isIncident = (value: unknown): value is PaymentIncident =>
  isRecord(value) && typeof value['id'] === 'string' && UUID.test(value['id']) && typeof value['occurredAt'] === 'string' && WHEN.test(value['occurredAt']) &&
  text(value['studentName'], 200) && text(value['concept'], 120) && text(value['error'], 160) &&
  (value['status'] === 'Pendiente' || value['status'] === 'Resuelta');
const isOverview = (value: unknown): value is PaymentsOverview =>
  isRecord(value) && Array.isArray(value['tariffs']) && value['tariffs'].every(isTariff) &&
  Array.isArray(value['incidents']) && value['incidents'].every(isIncident) &&
  cents(value['pendingIncidents']);

@Injectable({ providedIn: 'root' })
export class PaymentsAdminService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/admin/payments';

  async read(): Promise<PaymentsOverview> {
    const response = await firstValueFrom(this.http.get<unknown>(this.url));
    if (!isOverview(response)) throw new Error('La respuesta de tarifas no es válida.');
    return response;
  }

  async updateTariff(id: string, amountCents: number): Promise<void> {
    if (!UUID.test(id) || !cents(amountCents)) throw new Error('El monto no es válido.');
    await firstValueFrom(this.http.patch<unknown>(`${this.url}/tariffs/${id}`, { amountCents }));
  }

  async resolveIncident(id: string): Promise<void> {
    if (!UUID.test(id)) throw new Error('Identificador inválido.');
    await firstValueFrom(this.http.patch<unknown>(`${this.url}/incidents/${id}/resolve`, {}));
  }
}
