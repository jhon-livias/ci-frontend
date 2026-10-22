import { Component, inject } from '@angular/core';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';

@Component({
  template: `
    <main class="grid min-h-screen place-items-center bg-[#f8f5f5] p-6 text-center text-[#292324]">
      <section class="max-w-lg rounded-2xl bg-white p-10 shadow-[0_12px_36px_rgb(41_35_36_/_12%)]">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-[#92001f]">Administrador</p>
        <h1 class="mt-3 text-3xl font-black">Bienvenido{{ displayName() ? ', ' + displayName() : '' }}</h1>
        <p class="mt-4 text-[#5e5254]">Tu sesión se inició correctamente. El panel administrativo se incorporará aquí.</p>
      </section>
    </main>
  `,
})
export class AdministratorHomeComponent {
  private readonly session = inject(AuthSessionService);
  protected readonly displayName = () => this.session.user()?.displayName;
}
