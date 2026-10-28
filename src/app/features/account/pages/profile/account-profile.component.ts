import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { SitesService } from '../../../admin/data-access/sites.service';
import { AccountProfileService, type AccountProfile } from '../../data-access/account-profile.service';

type ProfileTab = 'personal' | 'academic' | 'settings';
type MenuName = 'gender' | 'marital' | 'country';

interface ProfileDraft {
  gender: string;
  birthDate: string;
  maritalStatus: string;
  mobileCountry: string;
  mobile: string;
  personalEmail: string;
  address: string;
}

const GENDERS = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'OTHER', label: 'Otros' },
] as const;

const MARITAL = [
  { value: 'SINGLE', label: 'Soltero' },
  { value: 'MARRIED', label: 'Casado' },
  { value: 'DIVORCED', label: 'Divorciado' },
] as const;

const COUNTRIES = [
  { value: '+51', label: '🇵🇪 +51' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+52', label: '🇲🇽 +52' },
  { value: '+54', label: '🇦🇷 +54' },
  { value: '+56', label: '🇨🇱 +56' },
  { value: '+57', label: '🇨🇴 +57' },
  { value: '+58', label: '🇻🇪 +58' },
  { value: '+593', label: '🇪🇨 +593' },
  { value: '+34', label: '🇪🇸 +34' },
] as const;

@Component({
  selector: 'app-account-profile',
  templateUrl: './account-profile.component.html',
})
export class AccountProfileComponent implements OnInit {
  private readonly profiles = inject(AccountProfileService);
  private readonly sites = inject(SitesService);
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  protected readonly genders = GENDERS;
  protected readonly maritalOptions = MARITAL;
  protected readonly countries = COUNTRIES;
  protected readonly tab = signal<ProfileTab>('personal');
  protected readonly profile = signal<AccountProfile | null>(null);
  protected readonly draft = signal<ProfileDraft | null>(null);
  protected readonly siteName = signal('');
  protected readonly menu = signal<MenuName | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal('');
  protected readonly noticeTone = signal<'ok' | 'error'>('ok');
  protected readonly password = signal('');
  protected readonly confirmation = signal('');
  protected readonly passwordVisible = signal(false);
  protected readonly headingName = computed(() => {
    const profile = this.profile();
    if (!profile) return this.session.user()?.displayName ?? '';
    const lastNames = [profile.paternalLastName, profile.maternalLastName].filter(Boolean).join(' ');
    return lastNames ? `${profile.firstName}, ${lastNames}` : profile.firstName;
  });
  protected readonly documentLabel = computed(() => this.profile()?.documentType === 'DNI' ? 'DNI (N° de documento)' : 'N° de documento');

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.notice.set('');
    try {
      const [profile, sites] = await Promise.all([
        this.profiles.get(),
        this.sites.list().catch(() => []),
      ]);
      this.profile.set(profile);
      this.draft.set({
        gender: profile.gender,
        birthDate: profile.birthDate,
        maritalStatus: profile.maritalStatus,
        mobileCountry: profile.mobileCountry || '+51',
        mobile: profile.mobile,
        personalEmail: profile.personalEmail,
        address: profile.address,
      });
      this.siteName.set(sites.find((site) => site.id === profile.siteId)?.name ?? (profile.siteId ? 'Sede asignada' : 'Sin sede'));
    } catch (error) {
      this.noticeTone.set('error');
      this.notice.set(this.profiles.message(error, 'No se pudo cargar el perfil.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected selectTab(tab: ProfileTab): void {
    this.tab.set(tab);
    this.menu.set(null);
    this.notice.set('');
  }

  protected label(options: readonly { value: string; label: string }[], value: string, placeholder: string): string {
    return options.find((option) => option.value === value)?.label ?? placeholder;
  }

  protected toggleMenu(name: MenuName): void {
    this.menu.update((current) => current === name ? null : name);
  }

  protected closeMenu(event: FocusEvent, name: MenuName): void {
    const next = event.relatedTarget;
    if (next instanceof Node && (event.currentTarget as HTMLElement).contains(next)) return;
    if (this.menu() === name) this.menu.set(null);
  }

  protected choose(name: MenuName, value: string): void {
    const key = name === 'gender' ? 'gender' : name === 'marital' ? 'maritalStatus' : 'mobileCountry';
    this.draft.update((current) => current ? { ...current, [key]: value } : current);
    this.menu.set(null);
  }

  protected setText(key: 'birthDate' | 'mobile' | 'personalEmail' | 'address', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draft.update((current) => current ? { ...current, [key]: value } : current);
  }

  protected async saveProfile(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving()) return;
    const problem = this.profileProblem(draft);
    if (problem) {
      this.noticeTone.set('error');
      this.notice.set(problem);
      return;
    }
    this.saving.set(true);
    this.notice.set('');
    try {
      const profile = await this.profiles.update(draft);
      this.profile.set(profile);
      this.noticeTone.set('ok');
      this.notice.set('Perfil actualizado.');
    } catch (error) {
      this.noticeTone.set('error');
      this.notice.set(this.profiles.message(error, 'No se pudo actualizar el perfil.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async savePassword(): Promise<void> {
    if (this.saving()) return;
    const password = this.password();
    if (password.length < 8 || password.length > 72 || /[<>]/.test(password)) {
      this.noticeTone.set('error');
      this.notice.set('La contraseña debe tener entre 8 y 72 caracteres.');
      return;
    }
    if (password !== this.confirmation()) {
      this.noticeTone.set('error');
      this.notice.set('Las contraseñas no coinciden.');
      return;
    }
    this.saving.set(true);
    this.notice.set('');
    try {
      await this.authApi.changePassword(password);
      this.session.passwordChanged();
      this.password.set('');
      this.confirmation.set('');
      this.noticeTone.set('ok');
      this.notice.set('Contraseña actualizada.');
    } catch (error) {
      this.noticeTone.set('error');
      this.notice.set(this.profiles.message(error, 'No se pudo actualizar la contraseña.'));
    } finally {
      this.saving.set(false);
    }
  }

  private profileProblem(draft: ProfileDraft): string {
    if (!draft.gender) return 'Selecciona el género.';
    if (!draft.birthDate) return 'Ingresa la fecha de nacimiento.';
    if (!/^\d{6,15}$/.test(draft.mobile)) return 'Ingresa un celular válido.';
    if (!draft.maritalStatus) return 'Selecciona el estado civil.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.personalEmail.trim())) return 'Ingresa un correo personal válido.';
    if (draft.address.trim().length < 5) return 'Ingresa la dirección.';
    return '';
  }
}
