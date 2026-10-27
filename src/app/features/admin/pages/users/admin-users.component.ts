import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';

import { INSTITUTIONAL_EMAIL_MESSAGE, institutionalEmail } from '../../../../core/auth/institutional-email';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/ui/checkbox/ui-checkbox.component';
import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent, type UiBreadcrumbItem } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { UiStepperComponent } from '../../../../shared/ui/stepper/ui-stepper.component';
import { UiTableComponent, type UiTableColumn, type UiTablePageChange, type UiTableRow, type UiTableSort } from '../../../../shared/ui/table/ui-table.component';
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
  readonly moduleCode: string;
  readonly name: string;
  readonly active: boolean;
  readonly functionalities: readonly { readonly name: string; readonly enabled: boolean }[];
}

const USER_KINDS = [
  { code: 'estudiante', label: 'Estudiante', description: 'Consulta su información y realiza sus trámites.' },
  { code: 'docente', label: 'Docente', description: 'Trabaja con sus grupos asignados.' },
  { code: 'asesora', label: 'Asesora', description: 'Realiza seguimiento académico de consulta.' },
  { code: 'director', label: 'Director', description: 'Gestiona la operación académica autorizada.' },
  { code: 'administrador', label: 'Administrador', description: 'Supervisa el sistema y administra accesos autorizados.' },
] as const;

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
  imports: [FormField, FormRoot, UiButtonComponent, UiCheckboxComponent, UiConfirmComponent, UiFieldComponent, UiFilterBarComponent, UiPageHeaderComponent, UiSelectComponent, UiStepperComponent, UiTableComponent],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly directory = inject(UserDirectoryService);
  private readonly permissionCatalog = inject(PermissionCatalogService);
  private readonly sitesCatalog = inject(SitesService);
  protected readonly steps = [{ label: 'Tipo de usuario' }, { label: 'Datos' }, { label: 'Permisos' }];
  protected readonly userKinds = USER_KINDS;
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
  protected readonly submitted = signal(false);
  private readonly takenDocument = signal<string | null>(null);
  private readonly takenEmail = signal<string | null>(null);
  protected readonly strictSubmit = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly step = signal(0);
  protected readonly kind = signal('');
  protected readonly typeSubmitted = signal(false);
  protected readonly values = signal<UserDraft>(emptyDraft());
  protected readonly accountForm = form(this.values, (path) => {
    required(path.firstName, { message: 'Ingresa los nombres.' });
    required(path.paternalLastName, { message: 'Ingresa el apellido paterno.' });
    required(path.documentNumber, { message: 'Ingresa el número de documento.' });
    required(path.email, { message: 'Ingresa el correo.' });
  });
  protected readonly permissionOptions = signal<readonly EditorPermission[]>([]);
  protected readonly visiblePermissions = computed(() => this.permissionOptions().filter((item) => item.moduleCode === this.kind() && (item.active || item.functionalities.some((feature) => feature.enabled))));
  protected readonly kindLabel = computed(() => USER_KINDS.find((item) => item.code === this.kind())?.label ?? '');
  protected readonly siteOptions = computed(() => this.sites().map((site) => ({ value: site.id, label: site.name })));
  protected readonly crumbs = computed<readonly UiBreadcrumbItem[]>(() => this.editorOpen() || this.resetNotice()
    ? [{ label: 'Inicio', action: 'list' }, { label: 'Usuarios', action: 'list' }]
    : [{ label: 'Inicio' }, { label: 'Usuarios' }]);
  protected readonly typeFilterOptions = computed<readonly UiSelectOption[]>(() => [
    { value: '', label: 'Todos' },
    ...this.types().map((type) => ({ value: type.code, label: type.name })),
  ]);
  protected readonly siteFilterOptions = computed<readonly UiSelectOption[]>(() => [
    { value: '', label: 'Todas' },
    ...this.sites().map((site) => ({ value: site.id, label: site.name })),
  ]);
  protected readonly statusFilterOptions = computed<readonly UiSelectOption[]>(() => [
    { value: '', label: 'Todos' },
    ...this.statuses().map((status) => ({ value: status.code, label: status.name })),
  ]);
  protected readonly siteError = computed(() => this.strictSubmit() && !this.values().siteId ? 'Selecciona una sede.' : undefined);
  protected readonly maternalError = computed(() => this.strictSubmit() && !this.values().maternalLastName.trim() ? 'Ingresa el apellido materno.' : undefined);
  protected readonly documentTypeError = computed(() => this.submitted() && !this.values().documentType ? 'Selecciona el tipo de documento.' : undefined);
  protected readonly countryError = computed(() => this.submitted() && !this.values().mobileCountry ? 'Selecciona el código de celular.' : undefined);
  protected readonly documentError = computed(() => {
    const draft = this.values();
    const number = draft.documentNumber.trim();
    if (this.takenDocument() && number === this.takenDocument()) return 'Ese documento ya está registrado.';
    if (!this.submitted()) return undefined;
    if (!number) return undefined;
    const valid = draft.documentType === 'DNI' ? /^\d{8}$/.test(number) : /^[A-Za-z0-9]{6,12}$/.test(number);
    if (valid) return undefined;
    return draft.documentType === 'DNI' ? 'El DNI debe tener 8 dígitos.' : 'Ingresa un documento de 6 a 12 caracteres.';
  });
  protected readonly mobileError = computed(() => {
    const mobile = this.values().mobile.trim();
    if (this.strictSubmit() && !mobile) return 'Ingresa el celular.';
    return this.submitted() && mobile && !/^\d{6,15}$/.test(mobile) ? 'Ingresa un celular válido.' : undefined;
  });
  protected readonly institutionalEmailMessage = INSTITUTIONAL_EMAIL_MESSAGE;
  protected readonly emailError = computed(() => {
    const email = this.values().email.trim().toLowerCase();
    if (this.takenEmail() && email === this.takenEmail()) return 'Ese correo ya está registrado.';
    return this.submitted() && email && !institutionalEmail(email) ? INSTITUTIONAL_EMAIL_MESSAGE : undefined;
  });
  protected readonly passwordError = computed(() => {
    if (!this.submitted()) return undefined;
    const password = this.values().password;
    const valid = this.editingId() ? password.length === 0 || password.length >= 8 : password.length >= 8;
    return valid ? undefined : 'La contraseña debe tener al menos 8 caracteres.';
  });
  protected readonly types = signal<readonly DirectoryOption[]>([]);
  protected readonly statuses = signal<readonly DirectoryOption[]>([]);
  protected readonly sites = signal<readonly { readonly id: string; readonly name: string }[]>([]);
  private readonly items = signal<readonly UserRow[]>([]);
  protected readonly columns = computed<readonly UiTableColumn[]>(() => [
    { key: 'document', label: 'Documento', sortable: true },
    { key: 'firstName', label: 'Nombres', sortable: true },
    { key: 'paternalLastName', label: 'Apellido paterno', sortable: true },
    { key: 'maternalLastName', label: 'Apellido materno', sortable: true },
    { key: 'type', label: `Tipo (${this.types().length})`, sortable: true },
  ]);
  protected readonly tableRows = computed(() => this.items().filter((item) => !item.placeholder).map((item) => ({
    id: item.id,
    document: item.documentNumber,
    firstName: item.firstName,
    paternalLastName: item.paternalLastName,
    maternalLastName: item.maternalLastName,
    type: item.typeName,
  })));
  protected readonly tableSort = computed<UiTableSort>(() => ({
    key: this.sort(),
    direction: this.direction() === 'asc' ? 'ascending' : 'descending',
  }));

  ngOnInit(): void {
    void this.loadSites();
    void this.load();
  }

  protected onCrumb(action: string): void {
    if (action === 'list') this.backToList();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
    void this.load();
  }

  protected onFilter(kind: 'role' | 'site' | 'status', value: string): void {
    if (kind === 'role') this.role.set(value);
    else if (kind === 'site') this.siteId.set(value);
    else this.status.set(value);
    this.page.set(0);
    void this.load();
  }

  protected onTableSort(event: UiTableSort): void {
    if (event.key !== 'document' && event.key !== 'firstName' && event.key !== 'paternalLastName' && event.key !== 'maternalLastName' && event.key !== 'type') return;
    this.sort.set(event.key);
    this.direction.set(event.direction === 'ascending' ? 'asc' : 'desc');
    this.page.set(0);
    void this.load();
  }

  protected onTablePage(event: UiTablePageChange): void {
    if (event.pageSize !== 5 && event.pageSize !== 10 && event.pageSize !== 20) return;
    if (event.page === this.page() && event.pageSize === this.pageSize()) return;
    this.pageSize.set(event.pageSize);
    this.page.set(event.page);
    void this.load();
  }

  protected editUser(row: UiTableRow): void {
    if (typeof row['id'] === 'string') void this.beginEdit(row['id']);
  }

  protected resetUser(row: UiTableRow): void {
    if (typeof row['id'] !== 'string') return;
    const id = row['id'];
    const current = this.items().find((item) => item.id === id);
    const name = current ? `${current.firstName} ${current.paternalLastName} ${current.maternalLastName}`.replace(/\s+/g, ' ').trim() : 'Usuario';
    this.ask('¿Estás seguro que deseas restablecer la contraseña de este usuario?', [
      { label: 'Nombre', value: name },
      { label: 'Documento', value: current?.documentNumber ?? '—' },
    ], () => this.resetPassword(id));
  }

  protected removeUser(row: UiTableRow): void {
    if (typeof row['id'] === 'string') this.remove(row['id']);
  }

  protected setDraft(key: 'documentType' | 'siteId' | 'mobileCountry' | 'enabled', value: string): void {
    this.values.update((current) => ({ ...current, [key]: value }));
  }

  protected async beginCreate(): Promise<void> {
    this.message.set('');
    const permissions = await this.loadPermissionCatalog();
    if (!permissions) return;
    this.editingId.set(null);
    this.kind.set('');
    this.typeSubmitted.set(false);
    this.values.set(emptyDraft());
    this.permissionOptions.set(permissions);
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
      const options = permissions.map((permission) => ({
        ...permission,
        functionalities: permission.functionalities.map((feature) => ({
          name: feature.name,
          enabled: enabled.has(`${permission.id}:${feature.name.toLocaleLowerCase('es')}`),
        })),
      }));
      this.permissionOptions.set(options);
      this.kind.set(inferKind(options));
      this.typeSubmitted.set(false);
      this.step.set(1);
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

  protected toggleMustChange(mustChange: boolean): void {
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
    this.submitted.set(false);
    this.strictSubmit.set(false);
    this.takenDocument.set(null);
    this.takenEmail.set(null);
    this.typeSubmitted.set(false);
    this.kind.set('');
    this.editorOpen.set(false);
    this.editingId.set(null);
    this.step.set(0);
  }

  protected chooseKind(code: string): void {
    if (this.kind() === code) return;
    this.kind.set(code);
    this.typeSubmitted.set(false);
    this.permissionOptions.update((items) => items.map((item) => item.moduleCode === code
      ? item
      : { ...item, functionalities: item.functionalities.map((feature) => ({ ...feature, enabled: false })) }));
    this.message.set('');
  }

  protected onStep(index: number): void {
    if (index === this.step()) return;
    if (index < this.step()) {
      this.step.set(index);
      return;
    }
    if (this.step() === 0 && !this.advanceFromType()) return;
    if (index === 1) return;
    this.advanceFromData();
  }

  protected next(): void {
    if (this.step() === 0) {
      this.advanceFromType();
      return;
    }
    this.advanceFromData();
  }

  private advanceFromType(): boolean {
    if (!this.kind()) {
      this.typeSubmitted.set(true);
      this.message.set('Elige el tipo de usuario.');
      return false;
    }
    this.typeSubmitted.set(false);
    this.message.set('');
    this.step.set(1);
    return true;
  }

  private advanceFromData(): void {
    const editing = this.editingId();
    if (!this.kind()) {
      this.typeSubmitted.set(true);
      this.message.set('Elige el tipo de usuario.');
      this.step.set(0);
      return;
    }
    if (!this.accountReady(!editing)) return;
    if (!editing) {
      this.step.set(2);
      return;
    }
    void this.persistUser(editing, this.toInput(true), 'next');
  }

  protected saveAccount(): void {
    if (!this.accountReady(false)) return;
    const editing = this.editingId();
    if (!editing) return;
    void this.persistUser(editing, this.toInput(true), 'stay');
  }

  protected allFeaturesOn(permissionId: string): boolean {
    const features = this.permissionOptions().find((item) => item.id === permissionId)?.functionalities ?? [];
    return features.length > 0 && features.every((feature) => feature.enabled);
  }

  protected toggleFeature(permissionId: string, name: string): void {
    this.permissionOptions.update((items) => items.map((item) => item.id === permissionId
      ? { ...item, functionalities: item.functionalities.map((feature) => feature.name === name ? { ...feature, enabled: !feature.enabled } : feature) }
      : item));
  }

  protected toggleAll(permissionId: string): void {
    const enabled = !this.allFeaturesOn(permissionId);
    this.permissionOptions.update((items) => items.map((item) => item.id === permissionId
      ? { ...item, functionalities: item.functionalities.map((feature) => ({ ...feature, enabled })) }
      : item));
  }

  protected async save(): Promise<void> {
    if (this.visiblePermissions().length === 0) {
      this.message.set('Este tipo todavía no tiene permisos.');
      return;
    }
    const input = this.toInput(false);
    if (!input.grants.some((grant) => grant.enabled)) {
      this.message.set('Activa al menos una funcionalidad.');
      return;
    }
    const editing = this.editingId();
    this.ask(
      editing ? '¿Estás seguro que deseas guardar los cambios de este usuario?' : '¿Estás seguro que deseas registrar un nuevo usuario con los datos ingresados?',
      this.accountDetails(input),
      () => this.persistUser(editing, input, 'close'),
    );
  }

  private accountReady(strict: boolean): boolean {
    this.submitted.set(true);
    this.strictSubmit.set(strict);
    this.accountForm().markAsTouched();
    const draft = this.values();
    const documentOk = draft.documentType === 'DNI' ? /^\d{8}$/.test(draft.documentNumber.trim()) : /^[A-Za-z0-9]{6,12}$/.test(draft.documentNumber.trim());
    const passwordOk = this.editingId() ? draft.password.length === 0 || draft.password.length >= 8 : draft.password.length >= 8;
    const emailOk = institutionalEmail(draft.email) !== null;
    const mobileOk = !strict || /^\d{6,15}$/.test(draft.mobile.trim());
    const namesOk = draft.firstName.trim().length > 0 && draft.paternalLastName.trim().length > 0 && (!strict || draft.maternalLastName.trim().length > 0);
    if (this.accountForm().invalid() || !namesOk || !documentOk || !passwordOk || !emailOk || !mobileOk || (strict && !draft.siteId) || (strict && !draft.documentType) || (strict && !draft.mobileCountry)) {
      this.message.set(passwordOk ? 'Revisa los datos marcados para continuar.' : 'La contraseña debe tener al menos 8 caracteres.');
      return false;
    }
    this.message.set('');
    return true;
  }

  private toInput(preserveAccess: boolean): UserInput {
    const draft = this.values();
    const grants = this.permissionOptions()
      .filter((permission) => preserveAccess || permission.moduleCode === this.kind())
      .flatMap((permission) => permission.functionalities.map((feature) => ({
        permissionId: permission.id,
        name: feature.name,
        enabled: feature.enabled,
      })));
    return {
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
      grants: preserveAccess && !grants.some((grant) => grant.enabled) ? [] : grants,
    };
  }

  private accountDetails(input: UserInput): readonly UiConfirmDetail[] {
    const site = this.siteOptions().find((item) => item.value === input.siteId)?.label ?? 'Sin sede';
    return [
      { label: 'Tipo', value: this.kindLabel() || 'Sin tipo' },
      { label: 'Nombres', value: input.firstName },
      { label: 'Apellidos', value: `${input.paternalLastName} ${input.maternalLastName}`.trim() },
      { label: 'Documento', value: input.documentNumber },
      { label: 'Sede', value: site },
      { label: 'Estado', value: input.enabled ? 'Habilitado' : 'Deshabilitado' },
    ];
  }

  private async persistUser(id: string | null, input: UserInput, after: 'close' | 'stay' | 'next'): Promise<void> {
    this.saving.set(true);
    this.message.set('');
    try {
      if (id) await this.directory.update(id, input);
      else await this.directory.create(input);
      if (after === 'close') {
        this.closeEditor();
        await this.load();
        return;
      }
      this.values.update((current) => ({ ...current, password: '' }));
      if (after === 'next') this.step.set(2);
      await this.load();
      if (!this.message()) this.message.set('Datos guardados.');
    } catch (error) {
      const text = readError(error, 'No se pudo guardar el usuario.');
      this.message.set(text);
      const documentTaken = text.includes('Ese documento') || text.includes('ese documento');
      const emailTaken = text.includes('Ese correo') || text.includes('ese correo');
      if (documentTaken || emailTaken) {
        this.takenDocument.set(documentTaken ? input.documentNumber : null);
        this.takenEmail.set(emailTaken ? input.email.trim().toLowerCase() : null);
        this.submitted.set(true);
        this.step.set(1);
      }
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
        moduleCode: item.moduleCode,
        name: item.name,
        active: item.enabled,
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

const inferKind = (permissions: readonly EditorPermission[]): string => {
  const counts = new Map<string, number>();
  for (const permission of permissions) {
    const enabled = permission.functionalities.filter((feature) => feature.enabled).length;
    if (enabled === 0) continue;
    counts.set(permission.moduleCode, (counts.get(permission.moduleCode) ?? 0) + enabled);
  }
  let chosen = '';
  let best = 0;
  for (const kind of USER_KINDS) {
    const count = counts.get(kind.code) ?? 0;
    if (count > best) {
      best = count;
      chosen = kind.code;
    }
  }
  return chosen;
};

const readError = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = error.error;
    if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string' && !body.message.includes('<')) return body.message;
  }
  return fallback;
};
