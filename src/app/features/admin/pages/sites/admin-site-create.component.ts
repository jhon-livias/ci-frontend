import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SitesService, type SiteDetail } from '../../data-access/sites.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';

@Component({
  selector: 'app-admin-site-create',
  imports: [FormField, FormRoot, RouterLink, UiButtonComponent, UiFieldComponent, UiSelectComponent],
  template: `
    <p class="text-xs text-[#7c8691]">Inicio / <a routerLink="/administracion/sedes" class="hover:underline">Sedes</a> / {{ editing() ? 'Editar sede' : 'Agregar sede' }}</p>
    <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
      <h1 class="font-[var(--font-heading)] text-2xl font-semibold text-[#a9002d]">{{ editing() ? 'Editar sede' : 'Agregar sede' }}</h1>
      <a routerLink="/administracion/sedes" class="text-sm font-semibold text-[#92001f] underline-offset-4 hover:underline focus-visible:outline-2">Volver a sedes</a>
    </div>
    <form [formRoot]="siteForm" (submit)="submit()" class="mt-6 space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8" novalidate>
      <div class="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <ui-field id="new-site-code" label="Código" [formField]="siteForm.code" hint="Mayúsculas, números, guion o guion bajo." />
        <ui-field id="new-site-name" label="Nombre" [formField]="siteForm.name" />
      </div>
      <fieldset>
        <legend class="mb-3 text-sm font-semibold text-[#5e5254]">Ubicación</legend>
        <div class="grid gap-4 sm:grid-cols-3">
          <ui-select id="site-department" label="Departamento" placeholder="Selecciona un departamento" [options]="departmentOptions()" [value]="departmentCode()" (valueChange)="departmentCode.set($event); changeDepartment()" />
          <ui-select id="site-province" label="Provincia" placeholder="Selecciona una provincia" [options]="provinceOptions()" [disabled]="!departmentCode()" [value]="provinceCode()" (valueChange)="provinceCode.set($event); changeProvince()" />
          <ui-select id="site-district" label="Distrito" placeholder="Selecciona un distrito" [options]="districtOptions()" [disabled]="!provinceCode()" [value]="districtCode()" (valueChange)="districtCode.set($event)" />
        </div>
      </fieldset>
      <div class="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <ui-field id="site-street" label="Calle" [formField]="siteForm.street" />
        <ui-field id="site-postal" label="Código postal" [formField]="siteForm.postalCode" placeholder="5 dígitos" />
      </div>
      @if (editing()) {
        <ui-select id="site-state" label="Estado" [options]="stateOptions" [value]="active()" (valueChange)="active.set($event)" />
      }
      <div class="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <ui-field id="site-phone" label="Teléfono" type="tel" [formField]="siteForm.phone" />
        <ui-field id="site-email" label="Correo electrónico" type="email" [formField]="siteForm.email" />
      </div>
      <div class="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <ui-field id="site-contact" label="Responsable" [formField]="siteForm.contactName" />
        <ui-field id="site-contact-phone" label="Teléfono del responsable" type="tel" [formField]="siteForm.contactPhone" />
      </div>
      <p class="text-sm text-[#5e5254]">Solo el código y el nombre son obligatorios. {{ editing() ? 'Los demás campos son opcionales.' : 'La sede se creará activa.' }}</p>
      @if (notice()) { <p role="alert" class="text-sm text-[#92001f]">{{ notice() }}</p> }
      <div class="flex justify-end"><ui-button type="submit" [disabled]="saving() || loading()">{{ saving() ? 'Guardando…' : (editing() ? 'Guardar cambios' : 'Guardar') }}</ui-button></div>
    </form>
  `,
})
export class AdminSiteCreateComponent implements OnInit {
  private readonly api = inject(SitesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly routeSiteId = this.route.snapshot.paramMap.get('id');
  protected readonly values = signal({ code: '', name: '', street: '', postalCode: '', phone: '', email: '', contactName: '', contactPhone: '' });
  protected readonly siteForm = form(this.values, (path) => { required(path.code, { message: 'Ingresa el código.' }); required(path.name, { message: 'Ingresa el nombre.' }); });
  protected readonly notice = signal('');
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly editing = computed(() => this.routeSiteId !== null);
  protected readonly departmentCode = signal('');
  protected readonly provinceCode = signal('');
  protected readonly districtCode = signal('');
  protected readonly departmentOptions = signal<readonly UiSelectOption[]>([]);
  protected readonly provinceOptions = signal<readonly UiSelectOption[]>([]);
  protected readonly districtOptions = signal<readonly UiSelectOption[]>([]);
  protected readonly active = signal('true');
  protected readonly stateOptions: readonly UiSelectOption[] = [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }];

  ngOnInit(): void { void this.initialize(); }

  protected async changeDepartment(): Promise<void> {
    this.provinceCode.set(''); this.districtCode.set(''); this.provinceOptions.set([]); this.districtOptions.set([]);
    if (!this.departmentCode()) return;
    try { this.provinceOptions.set((await this.api.provinces(this.departmentCode())).map(({ code, name }) => ({ value: code, label: name }))); }
    catch { this.notice.set('No se pudieron cargar las provincias.'); }
  }

  protected async changeProvince(): Promise<void> {
    this.districtCode.set(''); this.districtOptions.set([]);
    if (!this.provinceCode()) return;
    try { this.districtOptions.set((await this.api.districts(this.provinceCode())).map(({ code, name }) => ({ value: code, label: name }))); }
    catch { this.notice.set('No se pudieron cargar los distritos.'); }
  }

  protected async submit(): Promise<void> {
    this.siteForm().markAsTouched();
    const v = this.values();
    const code = v.code.trim(); const name = v.name.trim();
    const details = [v.street, v.contactName];
    const phones = [v.phone.trim(), v.contactPhone.trim()];
    if (this.siteForm().invalid() || !/^[A-Z0-9_-]{2,32}$/.test(code) || name.length < 2 || name.length > 100 || /[<>]/.test(name) || details.some((x, index) => /[<>]/.test(x) || x.trim().length > (index === 0 ? 255 : 100)) || (v.postalCode.trim() && !/^\d{5}$/.test(v.postalCode.trim())) || phones.some((x) => x && !/^[+\d ()-]{6,30}$/.test(x)) || (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) || v.email.trim().length > 254) {
      this.notice.set('Revisa los campos: código en mayúsculas, nombre, código postal de 5 dígitos, teléfonos y correo válidos.'); return;
    }
    const optional = (value: string): string | null => value.trim() || null;
    this.notice.set(''); this.saving.set(true);
    try {
      await this.api.save({ code, name, location: optional(v.street), active: this.active() === 'true', districtCode: this.districtCode() || null, street: optional(v.street), postalCode: optional(v.postalCode), phone: optional(v.phone), email: optional(v.email), contactName: optional(v.contactName), contactPhone: optional(v.contactPhone) }, this.routeSiteId ?? undefined);
      await this.router.navigateByUrl('/administracion/sedes');
    } catch { this.notice.set('No se pudo guardar la sede. Verifica los datos y que el código no exista.'); } finally { this.saving.set(false); }
  }

  private async loadDepartments(): Promise<void> {
    try { this.departmentOptions.set((await this.api.departments()).map(({ code, name }) => ({ value: code, label: name }))); }
    catch { this.notice.set('No se pudieron cargar los departamentos.'); }
  }

  private async initialize(): Promise<void> {
    this.loading.set(true);
    try {
      await this.loadDepartments();
      if (!this.routeSiteId) return;
      const site = await this.api.get(this.routeSiteId);
      await this.fillForEdit(site);
    } catch {
      this.notice.set('No se pudo cargar la sede para editarla.');
    } finally { this.loading.set(false); }
  }

  private async fillForEdit(site: SiteDetail): Promise<void> {
    this.values.set({ code: site.code, name: site.name, street: site.street ?? '', postalCode: site.postalCode ?? '', phone: site.phone ?? '', email: site.email ?? '', contactName: site.contactName ?? '', contactPhone: site.contactPhone ?? '' });
    this.active.set(String(site.active));
    const district = site.geographicDistrict;
    if (!district) return;
    const province = district.province;
    this.departmentCode.set(province.department.code);
    this.provinceOptions.set((await this.api.provinces(province.department.code)).map(({ code, name }) => ({ value: code, label: name })));
    this.provinceCode.set(province.code);
    this.districtOptions.set((await this.api.districts(province.code)).map(({ code, name }) => ({ value: code, label: name })));
    this.districtCode.set(district.code);
  }
}
