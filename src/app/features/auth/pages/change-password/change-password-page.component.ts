import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuthLayoutComponent } from '../../../../layouts/auth-layout/auth-layout.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';

interface PasswordChange {
  password: string;
  confirmation: string;
}

@Component({
  imports: [FormField, FormRoot, UiButtonComponent, UiFieldComponent, AuthLayoutComponent],
  templateUrl: './change-password-page.component.html',
})
export class ChangePasswordPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  protected readonly values = signal<PasswordChange>({ password: '', confirmation: '' });
  protected readonly passwordForm = form(this.values, (path) => {
    required(path.password, { message: 'Ingresa la nueva contraseña.' });
    minLength(path.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres.' });
    required(path.confirmation, { message: 'Confirma la nueva contraseña.' });
  });
  protected readonly notice = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);

  protected async submit(): Promise<void> {
    this.passwordForm().markAsTouched();
    if (this.passwordForm().invalid()) {
      this.notice.set('Revisa los datos marcados para continuar.');
      return;
    }
    const { password, confirmation } = this.values();
    if (password !== confirmation) {
      this.notice.set('Las contraseñas no coinciden.');
      return;
    }
    if (/[<>]/.test(password) || password.length > 72) {
      this.notice.set('La contraseña debe tener entre 8 y 72 caracteres.');
      return;
    }
    this.notice.set(null);
    this.isSubmitting.set(true);
    try {
      await this.authApi.changePassword(password);
      this.session.passwordChanged();
      await this.router.navigateByUrl('/inicio');
    } catch {
      this.notice.set('No se pudo cambiar la contraseña. Inténtalo nuevamente.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
