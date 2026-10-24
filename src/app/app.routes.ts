import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthSessionService } from './core/auth/auth-session.service';
import {
  administratorMatchGuard,
  anonymousGuard,
  authenticatedGuard,
} from './core/auth/session.guard';

const redirectToLanding = (): string =>
  inject(AuthSessionService).defaultRoute();

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: redirectToLanding,
  },
  {
    path: 'login',
    title: 'Iniciar sesión | Centro de Idiomas UPRIT',
    canActivate: [anonymousGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login-page.component').then(
        (module) => module.LoginPageComponent,
      ),
  },
  {
    path: 'recuperar-contrasena',
    title: 'Recuperar contraseña | Centro de Idiomas UPRIT',
    canActivate: [anonymousGuard],
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/forgot-password-page.component').then(
        (module) => module.ForgotPasswordPageComponent,
      ),
  },
  {
    path: 'inicio',
    title: 'Inicio | Centro de Idiomas UPRIT',
    canMatch: [administratorMatchGuard],
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'inicio',
    title: 'Inicio | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./features/home/pages/home-page.component').then(
        (module) => module.HomePageComponent,
      ),
  },
  // Fragments such as /#algo resolve to the root route and unknown paths resolve
  // here. In either case, an already restored session keeps the user in the app.
  { path: '**', redirectTo: redirectToLanding },
];
