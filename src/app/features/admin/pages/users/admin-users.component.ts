import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';

import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { UiStepperComponent } from '../../../../shared/ui/stepper/ui-stepper.component';
import { PermissionCatalogService } from '../../data-access/permission-catalog.service';
import { SitesService } from '../../data-access/sites.service';
import { UserDirectoryService, type DirectoryOption, type UserInput } from '../../data-access/user-directory.service';

interface UserRow {
  readonly id: string;
  readonly documentNumber: string;
  readonly firstName: string;
  readonly paternalLastName: string;
  readonly maternalLastName: string;
  readonly typeName: string;
  readonly placeholder: boolean;
}

type SortField = 'document' | 'firstName' | 'paternalLastName' | 'maternalLastName' | 'type';

interface UserDraft {
  documentType: string;
  documentNumber: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  siteId: string;
  phone: string;
  mobileCountry: string;
  mobile: string;
  email: string;
  password: string;
  enabled: string;
}

interface EditorPermission {
  readonly id: string;
  readonly name: string;
  readonly functionalities: readonly { readonly name: string; readonly enabled: boolean }[];
}

const emptyDraft = (): UserDraft => ({
  documentType: 'DNI',
  documentNumber: '',
  firstName: '',
  paternalLastName: '',
  maternalLastName: '',
  siteId: '',
  phone: '',
  mobileCountry: '+51',
  mobile: '',
  email: '',
  password: '',
  enabled: 'true',
});

@Component({
  selector: 'app-admin-users',
  imports: [FormField, FormRoot, UiConfirmComponent, UiFieldComponent, UiSelectComponent, UiStepperComponent],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly directory = inject(UserDirectoryService);
  private readonly permissionCatalog = inject(PermissionCatalogService);
  private readonly sitesCatalog = inject(SitesService);
  protected readonly steps = [{ label: 'Editar Datos' }, { label: 'Editar Permisos' }];
  protected readonly documentTypes: readonly UiSelectOption[] = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carné de extranjería' },
    { value: 'PASSPORT', label: 'Pasaporte' },
  ];
  protected readonly countries: readonly UiSelectOption[] = [
    { value: '+51', label: '🇵🇪 +51' },
    { value: '+1', label: '🇺🇸 +1' },
    { value: '+52', label: '🇲🇽 +52' },
    { value: '+54', label: '🇦🇷 +54' },
    { value: '+56', label: '🇨🇱 +56' },
    { value: '+57', label: '🇨🇴 +57' },
    { value: '+58', label: '🇻🇪 +58' },
    { value: '+593', label: '🇪🇨 +593' },
    { value: '+34', label: '🇪🇸 +34' },
  ];
  protected readonly statusOptions: readonly UiSelectOption[] = [
    { value: 'true', label: 'Habilitado' },
    { value: 'false', label: 'Deshabilitado' },
  ];
  protected readonly pageSizeOptions = [5, 10, 20] as const;
  protected readonly search = signal('');
  protected readonly role = signal('');
  protected readonly siteId = signal('');
  protected readonly status = signal('');
  protected readonly sort = signal<SortField>('paternalLastName');
  protected readonly direction = signal<'asc' | 'desc'>('asc');
  protected readonly page = signal(0);
  protected readonly pageSize = signal<(typeof this.pageSizeOptions)[number]>(5);
  protected readonly total = signal(0);
  protected readonly message = signal('');
  protected readonly saving = signal(false);
  protected readonly editorOpen = signal(false);
  protected readonly resetNotice = signal<{ id: string; username: string; password: string; mustChange: boolean } | null>(null);
  protected readonly confirmation = signal<{ message: string; details: readonly UiConfirmDetail[]; run: () => Promise<void> } | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly step = signal(0);
  protected readonly values = signal<UserDraft>(emptyDraft());
  protected readonly accountForm = form(this.values, (path) => {
    required(path.firstName, { message: 'Ingresa los nombres.' });
    required(path.paternalLastName, { message: 'Ingresa el apellido paterno.' });
    required(path.maternalLastName, { message: 'Ingresa el apellido materno.' });
    required(path.documentNumber, { message: 'Ingresa el número de documento.' });
    required(path.mobile, { message: 'Ingresa el celular.' });
    required(path.email, { message: 'Ingresa el correo.' });
  });
  protected readonly permissionOptions = signal<readonly EditorPermission[]>([]);
  protected readonly selectedPermissionId = signal('');
  protected readonly selectedPermission = computed(() => this.permissionOptions().find((item) => item.id === this.selectedPermissionId()) ?? null);
  protected readonly allFeaturesOn = computed(() => {
    const features = this.selectedPermission()?.functionalities ?? [];
    return features.length > 0 && features.every((feature) => feature.enabled);
  });
  protected readonly siteOptions = computed(() => this.sites().map((site) => ({ value: site.id, label: site.name })));
  protected readonly permissionChoices = computed(() => this.permissionOptions().map((item) => ({ value: item.id, label: item.name })));
  protected readonly types = signal<readonly DirectoryOption[]>([]);
  protected readonly statuses = signal<readonly DirectoryOption[]>([]);
  protected readonly sites = signal<readonly { readonly id: string; readonly name: string }[]>([]);
  private readonly items = signal<readonly UserRow[]>([]);

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly currentPage = computed(() => Math.min(this.page(), this.pageCount() - 1));
  protected readonly visibleRows = computed(() => {
    const size = this.pageSize();
    const missing = Math.max(0, size - this.items().length);
    const pads = Array.from({ length: missing }, (_, index): UserRow => ({
      id: `vacio-${this.currentPage()}-${index}`,
      documentNumber: '',
      firstName: '',
      paternalLastName: '',
      maternalLastName: '',
      typeName: '',
      placeholder: true,
    }));
    return [...this.items(), ...pads];
  });
  protected readonly rangeLabel = computed(() => {
    const total = this.total();
    if (total === 0) return '0-0 de 0';
    const start = this.currentPage() * this.pageSize() + 1;
    return `${start}-${Math.min(start + this.pageSize() - 1, total)} de ${total}`;
  });

  ngOnInit(): void {
    void this.loadSites();
    void this.load();
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(0);
    void this.load();
  }

  protected onFilter(kind: 'role' | 'site' | 'status', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (kind === 'role') this.role.set(value);
    else if (kind === 'site') this.siteId.set(value);
    else this.status.set(value);
    this.page.set(0);
    void this.load();
  }

  protected changeSort(field: SortField): void {
    if (this.sort() === field) this.direction.update((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      this.sort.set(field);
      this.direction.set('asc');
    }
    this.page.set(0);
    void this.load();
  }

  protected changePageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (value === 5 || value === 10 || value === 20) {
      this.pageSize.set(value);
      this.page.set(0);
      void this.load();
    }
  }

  protected changePage(next: number): void {
    const page = Math.min(Math.max(next, 0), this.pageCount() - 1);
    if (page === this.currentPage()) return;
    this.page.set(page);
    void this.load();
  }

  protected setDraft(key: 'documentType' | 'siteId' | 'mobileCountry' | 'enabled', value: string): void {
    this.values.update((current) => ({ ...current, [key]: value }));
  }

  protected async beginCreate(): Promise<void> {
    this.message.set('');
    const permissions = await this.loadPermissionCatalog();
    if (!permissions) return;
    this.editingId.set(null);
    this.values.set(emptyDraft());
    this.permissionOptions.set(permissions);
    this.selectedPermissionId.set(permissions[0]?.id ?? '');
    this.step.set(0);
    this.editorOpen.set(true);
  }

  protected async beginEdit(id: string): Promise<void> {
    this.message.set('');
    try {
      const [permissions, detail] = await Promise.all([this.loadPermissionCatalog(), this.directory.get(id)]);
      if (!permissions || !detail) return;
      const enabled = new Set(detail.grants.filter((grant) => grant.enabled).map((grant) => `${grant.permissionId}:${grant.name.toLocaleLowerCase('es')}`));
      this.editingId.set(id);
      this.values.set({
        documentType: detail.documentType,
        documentNumber: detail.documentNumber,
        firstName: detail.firstName,
        paternalLastName: detail.paternalLastName,
        maternalLastName: detail.maternalLastName,
        siteId: detail.siteId,
        phone: detail.phone,
        mobileCountry: detail.mobileCountry,
        mobile: detail.mobile,
        email: detail.email,
        password: '',
        enabled: detail.enabled ? 'true' : 'false',
      });
      this.permissionOptions.set(permissions.map((permission) => ({
        ...permission,
        functionalities: permission.functionalities.map((feature) => ({
          name: feature.name,
          enabled: enabled.has(`${permission.id}:${feature.name.toLocaleLowerCase('es')}`),
        })),
      })));
      this.selectedPermissionId.set(permissions[0]?.id ?? '');
      this.step.set(0);
      this.editorOpen.set(true);
    } catch {
      this.message.set('No se pudo abrir el usuario.');
    }
  }

  protected async resetPassword(id: string): Promise<void> {
    this.message.set('');
    this.saving.set(true);
    try {
      const result = await this.directory.resetPassword(id);
      this.resetNotice.set({ id, username: result.username, password: result.password, mustChange: false });
    } catch (error) {
      this.message.set(readError(error, 'No se pudo restablecer la contraseña.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected toggleMustChange(event: Event): void {
    const mustChange = (event.target as HTMLInputElement).checked;
    this.resetNotice.update((current) => (current ? { ...current, mustChange } : current));
  }

  protected async acceptReset(): Promise<void> {
    const notice = this.resetNotice();
    if (!notice) return;
    this.saving.set(true);
    this.message.set('');
    try {
      await this.directory.requirePasswordChange(notice.id, notice.mustChange);
      this.resetNotice.set(null);
    } catch (error) {
      this.message.set(readError(error, 'No se pudo guardar la opción de cambio de contraseña.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected remove(id: string): void {
    const current = this.items().find((item) => item.id === id);
    if (!current) return;
    this.ask('¿Estás seguro que deseas eliminar este usuario?', [
      { label: 'Nombre', value: `${current.firstName} ${current.paternalLastName}`.trim() },
      { label: 'Documento', value: current.documentNumber },
      { label: 'Tipo', value: current.typeName },
    ], () => this.performRemove(id));
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

  private ask(message: string, details: readonly UiConfirmDetail[], run: () => Promise<void>): void {
    this.confirmation.set({ message, details, run });
  }

  private async performRemove(id: string): Promise<void> {
    this.message.set('');
    try {
      await this.directory.remove(id);
      if (this.editingId() === id || this.resetNotice()?.id === id) this.backToList();
      await this.load();
    } catch (error) {
      this.message.set(readError(error, 'No se pudo eliminar el usuario.'));
    }
  }

  protected backToList(): void {
    this.resetNotice.set(null);
    this.closeEditor();
  }

  protected closeEditor(): void {
    this.editorOpen.set(false);
    this.editingId.set(null);
    this.step.set(0);
  }

  protected onStep(index: number): void {
    if (index <= 0) {
      this.step.set(0);
      return;
    }
    this.next();
  }

  protected next(): void {
    this.accountForm().markAsTouched();
    const draft = this.values();
    const documentOk = draft.documentType === 'DNI' ? /^\d{8}$/.test(draft.documentNumber) : /^[A-Za-z0-9]{6,12}$/.test(draft.documentNumber);
    const passwordOk = this.editingId() ? draft.password.length === 0 || draft.password.length >= 8 : draft.password.length >= 8;
    const contactOk = /^\d{6,15}$/.test(draft.mobile) && /^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/.test(draft.email);
    if (this.accountForm().invalid() || !documentOk || !passwordOk || !contactOk || !draft.siteId) {
      this.message.set(passwordOk ? 'Revisa los datos marcados para continuar.' : 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    this.message.set('');
    this.step.set(1);
  }

  protected toggleFeature(name: string): void {
    const id = this.selectedPermissionId();
    this.permissionOptions.update((items) => items.map((item) => item.id === id
      ? { ...item, functionalities: item.functionalities.map((feature) => feature.name === name ? { ...feature, enabled: !feature.enabled } : feature) }
      : item));
  }

  protected toggleAll(): void {
    const id = this.selectedPermissionId();
    const enabled = !this.allFeaturesOn();
    this.permissionOptions.update((items) => items.map((item) => item.id === id
      ? { ...item, functionalities: item.functionalities.map((feature) => ({ ...feature, enabled })) }
      : item));
  }

  protected async save(): Promise<void> {
    const grants = this.permissionOptions().flatMap((permission) => permission.functionalities.map((feature) => ({
      permissionId: permission.id,
      name: feature.name,
      enabled: feature.enabled,
    })));
    if (!grants.some((grant) => grant.enabled)) {
      this.message.set('Activa al menos una funcionalidad.');
      return;
    }
    const draft = this.values();
    const editing = this.editingId();
    const input: UserInput = {
      documentType: draft.documentType,
      documentNumber: draft.documentNumber.trim(),
      firstName: draft.firstName.trim(),
      paternalLastName: draft.paternalLastName.trim(),
      maternalLastName: draft.maternalLastName.trim(),
      siteId: draft.siteId,
      phone: draft.phone.trim() || undefined,
      mobileCountry: draft.mobileCountry,
      mobile: draft.mobile.trim(),
      email: draft.email.trim(),
      password: draft.password || undefined,
      enabled: draft.enabled === 'true',
      grants,
    };
    const site = this.siteOptions().find((item) => item.value === input.siteId)?.label ?? 'Sin sede';
    this.ask(
      editing ? '¿Estás seguro que deseas guardar los cambios de este usuario?' : '¿Estás seguro que deseas registrar un nuevo usuario con los datos ingresados?',
      [
        { label: 'Nombres', value: input.firstName },
        { label: 'Apellidos', value: `${input.paternalLastName} ${input.maternalLastName}`.trim() },
        { label: 'Documento', value: input.documentNumber },
        { label: 'Sede', value: site },
        { label: 'Estado', value: input.enabled ? 'Habilitado' : 'Deshabilitado' },
      ],
      () => this.persistUser(editing, input),
    );
  }

  private async persistUser(id: string | null, input: UserInput): Promise<void> {
    this.saving.set(true);
    this.message.set('');
    try {
      if (id) await this.directory.update(id, input);
      else await this.directory.create(input);
      this.closeEditor();
      await this.load();
    } catch (error) {
      this.message.set(readError(error, 'No se pudo guardar el usuario.'));
    } finally {
      this.saving.set(false);
    }
  }

  private async loadPermissionCatalog(): Promise<readonly EditorPermission[] | null> {
    try {
      const first = await this.permissionCatalog.list({ page: 1, pageSize: 20 });
      const items = [...first.items];
      for (let page = 2; items.length < first.total && page <= 5; page += 1) {
        const next = await this.permissionCatalog.list({ page, pageSize: 20 });
        items.push(...next.items);
      }
      return items.map((item) => ({
        id: item.id,
        name: item.name,
        functionalities: item.functionalities.map((feature) => ({ name: feature.name, enabled: false })),
      }));
    } catch {
      this.message.set('No se pudieron cargar los permisos.');
      return null;
    }
  }

  private async loadSites(): Promise<void> {
    try {
      const sites = await this.sitesCatalog.list();
      this.sites.set(sites.filter((site) => site.active).map((site) => ({ id: site.id, name: site.name })));
    } catch {
      this.sites.set([]);
    }
  }

  private async load(): Promise<void> {
    try {
      const result = await this.directory.list({
        search: this.search().trim() || undefined,
        role: this.role() || undefined,
        status: this.status() || undefined,
        siteId: this.siteId() || undefined,
        page: this.page() + 1,
        pageSize: this.pageSize(),
        sort: this.sort(),
        direction: this.direction(),
      });
      this.types.set(result.types);
      this.statuses.set(result.statuses);
      this.total.set(result.total);
      this.items.set(result.users.map((user) => ({
        id: user.id,
        documentNumber: user.documentNumber,
        firstName: user.firstName,
        paternalLastName: user.paternalLastName,
        maternalLastName: user.maternalLastName,
        typeName: user.typeName,
        placeholder: false,
      })));
      this.message.set('');
    } catch {
      this.items.set([]);
      this.total.set(0);
      this.message.set('No se pudieron cargar los usuarios.');
    }
  }
}

const readError = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = error.error;
    if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string' && !body.message.includes('<')) return body.message;
  }
  return fallback;
};
