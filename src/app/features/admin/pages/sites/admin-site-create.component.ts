import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SitesService, type SiteDetail } from '../../data-access/sites.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiPageHeaderComponent, type UiBreadcrumbItem } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';

@Component({
  selector: 'app-admin-site-create',
  imports: [FormField, FormRoot, RouterLink, UiButtonComponent, UiConfirmComponent, UiFieldComponent, UiPageHeaderComponent, UiSelectComponent],
  templateUrl: './admin-site-create.component.html',
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
  protected readonly crumbs = computed<readonly UiBreadcrumbItem[]>(() => [
    { label: 'Inicio' },
    { label: 'Sedes', href: '/administracion/sedes' },
    { label: this.editing() ? 'Editar sede' : 'Agregar sede' },
  ]);
  protected readonly pageTitle = computed(() => this.editing() ? 'Editar sede' : 'Agregar sede');
  protected readonly departmentCode = signal('');
  protected readonly provinceCode = signal('');
  protected readonly districtCode = signal('');
  protected readonly departmentOptions = signal<readonly UiSelectOption[]>([]);
  protected readonly provinceOptions = signal<readonly UiSelectOption[]>([]);
  protected readonly districtOptions = signal<readonly UiSelectOption[]>([]);
  protected readonly active = signal('true');
  protected readonly stateOptions: readonly UiSelectOption[] = [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }];
  protected readonly confirmation = signal<{ message: string; details: readonly UiConfirmDetail[]; run: () => Promise<void> } | null>(null);

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

  protected submit(): void {
    this.siteForm().markAsTouched();
    const v = this.values();
    const code = v.code.trim(); const name = v.name.trim();
    const details = [v.street, v.contactName];
    const phones = [v.phone.trim(), v.contactPhone.trim()];
    if (this.siteForm().invalid() || !/^[A-Z0-9_-]{2,32}$/.test(code) || name.length < 2 || name.length > 100 || /[<>]/.test(name) || details.some((x, index) => /[<>]/.test(x) || x.trim().length > (index === 0 ? 255 : 100)) || (v.postalCode.trim() && !/^\d{5}$/.test(v.postalCode.trim())) || phones.some((x) => x && !/^[+\d ()-]{6,30}$/.test(x)) || (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) || v.email.trim().length > 254) {
      this.notice.set('Revisa los campos: código en mayúsculas, nombre, código postal de 5 dígitos, teléfonos y correo válidos.'); return;
    }
    const labelOf = (options: readonly UiSelectOption[], value: string) => options.find((item) => item.value === value)?.label ?? '';
    const location = [labelOf(this.departmentOptions(), this.departmentCode()), labelOf(this.provinceOptions(), this.provinceCode()), labelOf(this.districtOptions(), this.districtCode()), v.street.trim()].filter((part) => part.length > 0).join(', ') || 'Sin ubicación';
    const active = this.editing() ? this.active() === 'true' : true;
    this.confirmation.set({
      message: this.editing() ? '¿Estás seguro que deseas guardar los cambios de esta sede con los datos ingresados?' : '¿Estás seguro que deseas registrar una nueva sede con los datos ingresados?',
      details: [
        { label: 'Nombre', value: name },
        { label: 'Ubicación', value: location },
        { label: 'Estado', value: active ? 'Activo' : 'Inactivo' },
      ],
      run: () => this.persist(code, name, v, active),
    });
  }

  protected cancelConfirmation(): void {
    this.confirmation.set(null);
  }

  protected async acceptConfirmation(): Promise<void> {
    const current = this.confirmation();
    if (!current) return;
    this.confirmation.set(null);
    await current.run();
  }

  private async persist(code: string, name: string, v: { street: string; postalCode: string; phone: string; email: string; contactName: string; contactPhone: string }, active: boolean): Promise<void> {
    const optional = (value: string): string | null => value.trim() || null;
    this.notice.set(''); this.saving.set(true);
    try {
      await this.api.save({ code, name, location: optional(v.street), active, districtCode: this.districtCode() || null, street: optional(v.street), postalCode: optional(v.postalCode), phone: optional(v.phone), email: optional(v.email), contactName: optional(v.contactName), contactPhone: optional(v.contactPhone) }, this.routeSiteId ?? undefined);
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
