import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import type { LoginCredentials } from '../../models/login-credentials.model';
import { AlertTone, UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { AuthLayoutComponent } from '../../../../layouts/auth-layout/auth-layout.component';
import { RecaptchaService } from '../../../../core/security/recaptcha.service';

@Component({
  imports: [
    FormField,
    FormRoot,
    RouterLink,
    UiAlertComponent,
    UiButtonComponent,
    UiFieldComponent,
    AuthLayoutComponent,
  ],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly recaptcha = inject(RecaptchaService);
  protected readonly credentials = signal<LoginCredentials>({ username: '', password: '' });
  protected readonly loginForm = form(this.credentials, (path) => {
    required(path.username, { message: 'Ingresa tu usuario institucional.' });
    required(path.password, { message: 'Ingresa tu contraseña.' });
    minLength(path.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres.' });
  });

  protected readonly notice = signal<{ text: string; tone: AlertTone } | null>(null);
  protected readonly isSubmitting = signal(false);

  protected async submit(): Promise<void> {
    this.loginForm().markAsTouched();

    if (this.loginForm().invalid()) {
      this.notice.set({ text: 'Revisa los datos marcados para continuar.', tone: 'warning' });
      return;
    }

    this.notice.set(null);
    this.isSubmitting.set(true);
    try {
      const recaptchaToken = await this.recaptcha.executeLogin();
      const authenticatedSession = await this.authApi.login(this.credentials(), recaptchaToken);
      this.session.start(authenticatedSession);
      await this.router.navigateByUrl(this.session.defaultRoute());
    } catch {
      this.notice.set({
        text: 'No pudimos iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.',
        tone: 'error',
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected notifyUnavailable(feature: 'Google'): void {
    this.notice.set({
      text: `La opción de ${feature} se habilitará al integrar el proveedor de identidad institucional.`,
      tone: 'info',
    });
  }
}
