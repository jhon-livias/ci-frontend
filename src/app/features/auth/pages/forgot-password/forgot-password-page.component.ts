import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, minLength, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { PasswordResetRequest } from '../../models/password-reset-request.model';
import { AlertTone, UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { AuthLayoutComponent } from '../../../../layouts/auth-layout/auth-layout.component';

@Component({
  imports: [FormField, FormRoot, RouterLink, UiAlertComponent, UiButtonComponent, UiFieldComponent, AuthLayoutComponent],
  templateUrl: './forgot-password-page.component.html',
})
export class ForgotPasswordPageComponent {
  private readonly authApi = inject(AuthApiService);
  protected readonly request = signal<PasswordResetRequest>({ email: '' });
  protected readonly recoveryForm = form(this.request, (path) => {
    required(path.email, { message: 'Ingresa tu correo electrónico.' });
    email(path.email, { message: 'Ingresa un correo electrónico válido.' });
  });
  protected readonly reset = signal({ code: '', password: '' });
  protected readonly resetForm = form(this.reset, (path) => {
    required(path.code, { message: 'Ingresa el código.' });
    minLength(path.code, 8, { message: 'Revisa el código e inténtalo nuevamente.' });
    required(path.password, { message: 'Ingresa la nueva contraseña.' });
    minLength(path.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres.' });
  });
  protected readonly notice = signal<{ text: string; tone: AlertTone } | null>(null);
  protected readonly sent = signal(false);
  protected readonly done = signal(false);
  protected readonly submitting = signal(false);

  protected async submit(): Promise<void> {
    this.recoveryForm().markAsTouched();
    if (this.recoveryForm().invalid()) {
      this.notice.set({ text: 'Revisa el correo electrónico para continuar.', tone: 'warning' });
      return;
    }
    this.notice.set(null);
    this.submitting.set(true);
    try {
      await this.authApi.requestPasswordRecovery(this.request().email.trim());
    } catch {
      // La pantalla siguiente es la misma aunque el correo no exista o el envío falle.
    } finally {
      this.submitting.set(false);
      this.sent.set(true);
    }
  }

  protected async confirm(): Promise<void> {
    this.resetForm().markAsTouched();
    const code = this.reset().code.trim();
    const password = this.reset().password;
    if (this.resetForm().invalid() || !/^\d{8}$/.test(code)) {
      this.notice.set({ text: 'Revisa el código y la contraseña para continuar.', tone: 'warning' });
      return;
    }
    this.notice.set(null);
    this.submitting.set(true);
    try {
      await this.authApi.confirmPasswordRecovery(this.request().email.trim(), code, password);
      this.done.set(true);
      this.notice.set({ text: 'La contraseña fue restablecida. Ya puedes iniciar sesión.', tone: 'success' });
    } catch {
      this.notice.set({
        text: 'No pudimos restablecer la contraseña. Revisa el código e inténtalo nuevamente.',
        tone: 'error',
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
