import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface Site { readonly id: string; readonly code: string; readonly name: string; readonly location: string | null; readonly active: boolean; readonly districtCode: string | null; }
export interface GeographicOption { readonly code: string; readonly name: string; }
export interface SiteDetail extends Site {
  readonly street: string | null;
  readonly postalCode: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly contactName: string | null;
  readonly contactPhone: string | null;
  readonly geographicDistrict: { readonly code: string; readonly name: string; readonly province: { readonly code: string; readonly name: string; readonly department: GeographicOption } } | null;
}
export interface SiteInput { readonly code: string; readonly name: string; readonly location: string | null; readonly active: boolean; readonly districtCode?: string | null; readonly street?: string | null; readonly postalCode?: string | null; readonly phone?: string | null; readonly email?: string | null; readonly contactName?: string | null; readonly contactPhone?: string | null; }
const validId = (id: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function isSite(value: unknown): value is Site {
  if (!isRecord(value)) return false;
  const v = value;
  return typeof v['id'] === 'string' && validId(v['id']) && typeof v['code'] === 'string' && typeof v['name'] === 'string' && (v['location'] === null || typeof v['location'] === 'string') && typeof v['active'] === 'boolean' && (v['districtCode'] === null || typeof v['districtCode'] === 'string');
}
const isOption = (value: unknown): value is GeographicOption => isRecord(value) && typeof value['code'] === 'string' && /^(?:\d{3}|\d{5}|\d{7})$/.test(value['code']) && typeof value['name'] === 'string';
const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';
const isSiteDetail = (value: unknown): value is SiteDetail => {
  if (!isSite(value) || !isRecord(value) || !['street', 'postalCode', 'phone', 'email', 'contactName', 'contactPhone'].every((key) => isNullableString(value[key]))) return false;
  const district = value['geographicDistrict'];
  return district === null || (isRecord(district) && isOption(district) && isRecord(district['province']) && isOption(district['province']) && isOption(district['province']['department']));
};

@Injectable({ providedIn: 'root' })
export class SitesService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/auth/admin/sites';
  async list(): Promise<readonly Site[]> {
    const result = await firstValueFrom(this.http.get<unknown>(this.url));
    if (!Array.isArray(result) || !result.every(isSite)) throw new Error('Respuesta inválida');
    return result;
  }
  async get(id: string): Promise<SiteDetail> {
    if (!validId(id)) throw new Error('Identificador inválido');
    const result = await firstValueFrom(this.http.get<unknown>(`${this.url}/${id}`));
    if (!isSiteDetail(result)) throw new Error('Respuesta de sede inválida');
    return result;
  }
  async save(data: SiteInput, id?: string): Promise<void> {
    if (id && !validId(id)) throw new Error('Identificador inválido');
    await firstValueFrom(id ? this.http.put<unknown>(`${this.url}/${id}`, data) : this.http.post<unknown>(this.url, data));
  }
  async remove(id: string): Promise<void> {
    if (!validId(id)) throw new Error('Identificador inválido');
    await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
  }
  async departments(): Promise<readonly GeographicOption[]> { return this.listGeography('departments'); }
  async provinces(departmentCode: string): Promise<readonly GeographicOption[]> { return this.listGeography('provinces', departmentCode, /^\d{3}$/); }
  async districts(provinceCode: string): Promise<readonly GeographicOption[]> { return this.listGeography('districts', provinceCode, /^\d{5}$/); }
  private async listGeography(resource: 'departments' | 'provinces' | 'districts', code?: string, expected?: RegExp): Promise<readonly GeographicOption[]> {
    if (code && expected && !expected.test(code)) throw new Error('Código geográfico inválido');
    const response = await firstValueFrom(this.http.get<unknown>(`${this.url}/geography/${resource}`, { params: code ? { code } : undefined }));
    if (!Array.isArray(response) || !response.every(isOption)) throw new Error('Respuesta geográfica inválida');
    return response;
  }
}
