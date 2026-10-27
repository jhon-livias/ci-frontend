import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);
  protected readonly credentials = signal<LoginCredentials>({ username: '', password: '' });
  protected readonly loginForm = form(this.credentials, (path) => {
    required(path.username, { message: 'Ingresa tu usuario institucional.' });
    required(path.password, { message: 'Ingresa tu contraseña.' });
    minLength(path.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres.' });
  });

  protected readonly notice = signal<{ text: string; tone: AlertTone } | null>(
    googleLoginNotice(this.route.snapshot.queryParamMap.get('google')),
  );
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

  protected continueWithGoogle(): void {
    window.location.assign('/api/v1/auth/google');
  }
}

const googleLoginNotice = (reason: string | null): { text: string; tone: AlertTone } | null => {
  switch (reason) {
    case 'denied':
      return { text: 'Cancelaste el ingreso con Google.', tone: 'info' };
    case 'unverified':
      return { text: 'Google no confirmó un correo institucional.', tone: 'error' };
    case 'unknown':
      return {
        text: 'No hay una cuenta registrada con ese correo. Pide a administración que te cree el usuario.',
        tone: 'warning',
      };
    case 'unconfigured':
      return { text: 'El ingreso con Google todavía no está configurado.', tone: 'info' };
    case 'failed':
      return { text: 'No se pudo completar el ingreso con Google.', tone: 'error' };
    default:
      return null;
  }
};
