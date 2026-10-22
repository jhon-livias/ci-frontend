import { Component, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { PasswordResetRequest } from '../../models/password-reset-request.model';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { AuthLayoutComponent } from '../../../../layouts/auth-layout/auth-layout.component';

@Component({
  imports: [FormField, FormRoot, RouterLink, UiButtonComponent, UiFieldComponent, AuthLayoutComponent],
  templateUrl: './forgot-password-page.component.html',
})
export class ForgotPasswordPageComponent {
  protected readonly request = signal<PasswordResetRequest>({ email: '' });
  protected readonly recoveryForm = form(this.request, (path) => {
    required(path.email, { message: 'Ingresa tu correo electrónico.' });
    email(path.email, { message: 'Ingresa un correo electrónico válido.' });
  });
  protected readonly notice = signal<string | null>(null);

  protected submit(): void {
    this.recoveryForm().markAsTouched();

    if (this.recoveryForm().invalid()) {
      this.notice.set('Revisa el correo electrónico para continuar.');
      return;
    }

    // El Gateway deberá responder de forma uniforme para no revelar si una cuenta existe.
    this.notice.set('La recuperación estará disponible cuando se publique el servicio de autenticación.');
  }
}
